import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import fs from "fs";
import path from "path";

const router = express.Router();

const DATA_MAP: { label: string; value: string; subDir?: string }[] = [
  { label: "README", value: "README" },
  { label: "导演规划", value: "director_planning_narrative", subDir: "driector_skills" },
  { label: "分镜表", value: "director_storyboard_table_narrative", subDir: "driector_skills" },
];

function readMd(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

async function readAllImages(imagesDir: string) {
  try {
    const ossPath = u.getPath(path.join("skills", "story_skills", imagesDir, "images"));
    const files = fs.readdirSync(ossPath);
    const images = files.filter((f) => /\.(png|jpe?g|gif|webp|svg)$/i.test(f)).map((f) => path.join("story_skills", imagesDir, "images", f));
    return images.length ? Promise.all(images.map(async (i) => await u.oss.getFileUrl(i, "skills"))) : [];
  } catch {
    return [];
  }
}

export default router.post("/", async (req, res) => {
  try {
    const artPromptsDir = u.getPath(["skills", "story_skills"]);
    const styleDirs = fs
      .readdirSync(artPromptsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith("global_beauty_"))
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b));

    const result = await Promise.all(
      styleDirs.map(async (directorManual) => {
        const styleDir = path.join(artPromptsDir, directorManual);
        const images = await readAllImages(directorManual);
        const readmePath = path.join(styleDir, "README.md");
        const readmeContent = fs.readFileSync(readmePath, "utf-8");
        const firstLine = readmeContent.split("\n")[0].replace(/--/g, "");
        const data = DATA_MAP.map(({ label, value, subDir }) => {
          const mdPath = path.join(styleDir, ...(subDir ? [subDir] : []), `${value}.md`);
          return { label, value, data: readMd(mdPath) };
        });

        return { name: firstLine, image: images, directorManual, data };
      }),
    );
    res.status(200).send(success(result));
  } catch (err) {
    res.status(500).send({ error: String(err) });
  }
});
