import express from "express";
import u from "@/utils";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import {
  isReferenceFallbackError,
  normalizeTransferSetting,
  parseVideoMode,
  resolveVideoReferenceList,
  uploadReferenceListToTransfer,
} from "./videoReferences";
const router = express.Router();

type Type = "imageReference" | "startImage" | "endImage" | "videoReference" | "audioReference";
interface UploadItem {
  fileType: "image" | "video" | "audio";
  type: Type;
  sources?: "assets" | "storyboard" | "upload";
  id?: number;
  path?: string;
  src?: string;
  label?: string;
  prompt?: string;
}

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    scriptId: z.number(),
    uploadData: z.array(
      z.object({
        id: z.number().nullable().optional(),
        sources: z.string(),
        path: z.string().optional(),
        src: z.string().optional(),
        fileType: z.string().optional(),
      }),
    ),
    prompt: z.string(),
    model: z.string(),
    mode: z.string(),
    resolution: z.string(),
    duration: z.number(),
    audio: z.boolean().optional(),
    trackId: z.number(),
    transferSetting: z
      .object({
        baseUrl: z.string().optional(),
        token: z.string().optional(),
      })
      .optional(),
  }),
  async (req, res) => {
    const { scriptId, projectId, prompt, uploadData, model, duration, resolution, audio, mode, trackId } = req.body;
    const transferSetting = normalizeTransferSetting(req.body.transferSetting);
    const effectiveMode = parseVideoMode(mode);
    //获取生成视频比例
    const ratio = await u.db("o_project").select("videoRatio").where("id", projectId).first();
    const videoPath = `/${projectId}/video/${uuidv4()}.mp4`; //视频保存路径
    //新增
    const [videoId] = await u.db("o_video").insert({
      filePath: videoPath,
      time: Date.now(),
      state: "生成中",
      scriptId,
      projectId,
      videoTrackId: trackId,
    });
    res.status(200).send(success(videoId));
    const relatedObjects = {
      projectId,
      videoId,
      scriptId,
      type: "视频",
    };
    const aiVideo = u.Ai.Video(model);
    (async () => {
      const referenceList = await resolveVideoReferenceList(uploadData as UploadItem[], projectId, scriptId, trackId, model, effectiveMode);
      const runVideo = async (refs = referenceList) => {
      await aiVideo.run(
        {
          prompt,
          referenceList: refs,
          mode: effectiveMode as any,
          duration,
          aspectRatio: (ratio?.videoRatio as "16:9" | "9:16") || "16:9",
          resolution,
          audio,
        },
        {
          projectId,
          taskClass: "视频生成",
          describe: "根据提示词生成视频",
          relatedObjects: JSON.stringify(relatedObjects),
        },
      );
      };
      try {
        await runVideo();
      } catch (error) {
        if (!transferSetting || !isReferenceFallbackError(error)) throw error;
        try {
          const publicReferenceList = await uploadReferenceListToTransfer(referenceList, transferSetting);
          Object.assign(relatedObjects, {
            transferReferences: publicReferenceList
              .filter((reference) => reference.publicUrl)
              .map((reference) => ({ type: reference.type, publicUrl: reference.publicUrl, expiresAt: reference.expiresAt })),
          });
          await runVideo(publicReferenceList);
        } catch (fallbackError) {
          throw new Error(`${u.error(error).message}; public URL fallback failed: ${u.error(fallbackError).message}`);
        }
      }
      await aiVideo.save(videoPath);
      await u.db("o_video").where("id", videoId).update({ state: "生成成功" });
    })().catch(async (error: any) => {
        await u
          .db("o_video")
          .where("id", videoId)
          .update({
            state: "生成失败",
            errorReason: u.error(error).message,
          });
      });
  },
);
