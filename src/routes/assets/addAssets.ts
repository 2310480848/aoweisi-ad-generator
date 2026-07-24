import express from "express";
import u from "@/utils";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { normalizeAssetType } from "@/utils/assetTypes";
const router = express.Router();

// 新增资产
export default router.post(
  "/",
  validateFields({
    name: z.string(),
    describe: z.string(),
    type: z.string(),
    projectId: z.number(),
    remark: z.string().optional().nullable(),
    prompt: z.string().optional().nullable(),
    base64: z.string().optional().nullable(),
  }),
  async (req, res) => {
    const { name, describe, type, projectId, remark, prompt, base64 } = req.body;
    const normalizedType = normalizeAssetType(type);
    const [assetsId] = await u.db("o_assets").insert({
      name,
      describe,
      type: normalizedType,
      projectId,
      remark,
      prompt,
      startTime: Date.now(),
    });
    if (base64) {
      const realBase64 = base64.match(/^data:image\/\w+;base64,(.+)$/)?.[1] ?? base64;
      const savePath = `/${projectId}/${normalizedType}/${uuidv4()}.png`;
      await u.oss.writeFile(savePath, Buffer.from(realBase64, "base64"));
      const [imageId] = await u.db("o_image").insert({
        assetsId,
        filePath: savePath,
        type: normalizedType,
        state: "已完成",
      });
      await u.db("o_assets").where("id", assetsId).update({ imageId });
    }
    res.status(200).send(success({ message: "新增资产成功" }));
  },
);
