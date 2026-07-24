import express from "express";
import u from "@/utils";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { decodeBase64Data } from "@/utils/base64";

const router = express.Router();

function getMime(base64Data: string) {
  return base64Data.match(/^data:([^;]+);base64,/)?.[1] ?? "";
}

function getExtFromBase64(base64Data: string): string {
  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/aac": "aac",
    "audio/flac": "flac",
    "audio/mp4": "m4a",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return mimeMap[getMime(base64Data)] ?? "bin";
}

function getFileTypeFromBase64(base64Data: string): "image" | "video" | "audio" {
  const mime = getMime(base64Data);
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "image";
}

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    base64Data: z.string(),
    type: z.string().optional().default("clip"),
    name: z.string(),
    saveAsAsset: z.boolean().optional().default(true),
  }),
  async (req, res) => {
    const { base64Data, projectId, type = "clip", name, saveAsAsset } = req.body;
    const fileBuffer = decodeBase64Data(base64Data);
    if (!fileBuffer) return res.status(400).send(error("无效的base64数据"));

    const ext = getExtFromBase64(base64Data);
    if (ext === "bin") return res.status(400).send(error("不支持的文件类型"));

    const fileType = getFileTypeFromBase64(base64Data);
    const savePath = saveAsAsset ? `/${projectId}/assets/${uuid()}.${ext}` : `/${projectId}/temp/reference/${uuid()}.${ext}`;
    await u.oss.writeFile(savePath, fileBuffer);

    if (!saveAsAsset) {
      return res.status(200).send(
        success({
          id: null,
          src: fileType === "image" ? await u.oss.getSmallImageUrl(savePath) : await u.oss.getFileUrl(savePath),
          path: savePath,
          sources: "upload",
          fileType,
          prompt: name,
        }),
      );
    }

    const [id] = await u.db("o_assets").insert({
      type: fileType,
      projectId,
      name,
      startTime: Date.now(),
    });
    const [imageId] = await u.db("o_image").insert({
      filePath: savePath,
      type,
      assetsId: id,
      state: "已完成",
    });
    await u.db("o_assets").where("id", id).update({ imageId });

    res.status(200).send(
      success({
        id,
        src: fileType === "image" ? await u.oss.getSmallImageUrl(savePath) : await u.oss.getFileUrl(savePath),
        path: savePath,
        sources: "assets",
        fileType,
        prompt: name,
      }),
    );
  },
);
