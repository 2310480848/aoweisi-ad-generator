import express from "express";
import u from "@/utils";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { decodeBase64Data } from "@/utils/base64";
const router = express.Router();

// 文件上传（支持图片、音频、视频）
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    scriptId: z.number(),
    base64Data: z.string(),
  }),
  async (req, res) => {
    const { base64Data, projectId, scriptId } = req.body;
    function getExtFromBase64(base64Data: string): string {
      const mime = base64Data.match(/^data:([^;]+);base64,/)?.[1] ?? "";
      const mimeMap: Record<string, string> = {
        // 图片
        "image/jpeg": "jpeg",
        "image/jpg": "jpg",
        "image/png": "png",
        // 音频
        "audio/mpeg": "mp3",
        "audio/mp3": "mp3",
        "audio/wav": "wav",
        // 视频
        "video/mp4": "mp4",
        "video/webm": "webm",
      };
      return mimeMap[mime] ?? "bin";
    }
    const ext = getExtFromBase64(base64Data);
    if (!["jpeg", "jpg", "png"].includes(ext)) {
      return res.status(400).send(error("不支持的文件类型"));
    }
    const savePath = `/${projectId}/imageFlow/${scriptId}/${uuid()}.${ext}`;
    const fileBuffer = decodeBase64Data(base64Data);
    if (!fileBuffer) return res.status(400).send(error("无效的base64数据"));

    await u.oss.writeFile(savePath, fileBuffer);
    const url = await u.oss.getSmallImageUrl(savePath);
    res.status(200).send(success(url));
  },
);
