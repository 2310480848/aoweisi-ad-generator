import express from "express";
import { error, success } from "@/lib/responseFormat";
import u from "@/utils";
import { z } from "zod";
import { validateFields } from "@/middleware/middleware";
import { isMarkdownFile, resolveModelPromptPath } from "./modelPromptPath";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    vendorId: z.string(),
    model: z.string(),
    path: z.string(),
    fileName: z.string(),
  }),
  async (req, res) => {
    const { vendorId, model, path, fileName } = req.body;
    const promptPath = resolveModelPromptPath(path);
    if (!promptPath) return res.status(400).send(error("非法路径"));
    if (!(await isMarkdownFile(promptPath))) return res.status(404).send(error("文件不存在"));

    const data = await u.db("o_modelPrompt").where("model", model).andWhere("vendorId", vendorId).select("*").first();
    if (data) {
      await u.db("o_modelPrompt").where("model", model).andWhere("vendorId", vendorId).update({ fileName, path });
      res.status(200).send(success("绑定成功"));
    } else {
      await u.db("o_modelPrompt").insert({ vendorId, model, path, fileName });
      res.status(200).send(success("绑定成功"));
    }
  },
);
