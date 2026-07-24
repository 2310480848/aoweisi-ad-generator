import express from "express";
import u from "@/utils";
import { error, success } from "@/lib/responseFormat";
import fs from "fs";
import path from "path";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";

const router = express.Router();

const DATA_MAP: { value: string; subDir?: string }[] = [
  { value: "README" },
  { value: "prefix" },
  { value: "art_character", subDir: "art_prompt" },
  { value: "art_character_derivative", subDir: "art_prompt" },
  { value: "art_prop", subDir: "art_prompt" },
  { value: "art_prop_derivative", subDir: "art_prompt" },
  { value: "art_scene", subDir: "art_prompt" },
  { value: "art_scene_derivative", subDir: "art_prompt" },
  { value: "director_storyboard", subDir: "driector_skills" },
  { value: "art_storyboard_video", subDir: "art_prompt" },
  { value: "director_planning_style", subDir: "driector_skills" },
  { value: "director_storyboard_table_style", subDir: "driector_skills" },
];

const SUB_DIR_MAP = new Map(DATA_MAP.map(({ value, subDir }) => [value, subDir ?? ""]));
const VALID_KEYS = new Set(DATA_MAP.map(({ value }) => value));

export default router.post(
  "/",
  validateFields({
    name: z.string(),
    images: z.array(z.string()),
    stylePath: z.string(),
    data: z.array(z.object({ label: z.string(), value: z.string(), data: z.string() })),
  }),
  async (req, res) => {
    try {
      const { name, images, data, stylePath } = req.body as {
        name: string;
        images: string[];
        data: { label: string; value: string; data: string }[];
        stylePath: string;
      };

      if (name.includes("/") || name.includes("\\") || name === "." || name === ".." || /^\d+$/.test(name)) {
        res.status(400).send(error("名称不能包含路径分隔符或为纯数字"));
        return;
      }

      const mainPath = u.getPath(["skills", "art_skills", stylePath]);
      if (fs.existsSync(mainPath)) {
        return res.status(400).send(error("请勿填写重复名称的视觉手册"));
      }

      for (const item of data) {
        if (!VALID_KEYS.has(item.value)) continue;

        const subDir = SUB_DIR_MAP.get(item.value)!;
        const filePath = u.getPath([mainPath, ...(subDir ? [subDir] : []), `${item.value}.md`]);
        const fileDir = path.dirname(filePath);
        if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });
        fs.writeFileSync(filePath, item.data, "utf-8");
      }

      const imagesDir = path.join(mainPath, "images");
      if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

      for (const item of images) {
        if (item.startsWith("http")) continue;

        const targetPath = path.join(imagesDir, `${u.uuid()}.jpg`);
        const buffer = Buffer.from(item.replace(/^data:[^;]+;base64,/, ""), "base64");
        fs.writeFileSync(targetPath, buffer);
      }

      res.status(200).send(success());
    } catch (err) {
      res.status(500).send({ error: String(err) });
    }
  },
);
