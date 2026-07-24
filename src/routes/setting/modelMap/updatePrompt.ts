import express from "express";
import { error, success } from "@/lib/responseFormat";
import { z } from "zod";
import { validateFields } from "@/middleware/middleware";
import fs from "fs/promises";
import { isMarkdownFile, isSafePromptName, resolveModelPromptPath } from "./modelPromptPath";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    name: z.string().min(1),
    data: z.string(),
    type: z.enum(["image", "video"]),
  }),
  async (req, res) => {
    const { name, data, type } = req.body;
    if (!isSafePromptName(name)) return res.status(400).send(error("非法文件名"));

    const filePath = resolveModelPromptPath(type, `${name}.md`);
    if (!filePath) return res.status(400).send(error("非法路径"));

    // 文件不存在则报错
    if (!(await isMarkdownFile(filePath))) return res.status(404).send(error("文件不存在"));

    await fs.writeFile(filePath, data, "utf-8");
    res.status(200).send(success("更新成功"));
  },
);
