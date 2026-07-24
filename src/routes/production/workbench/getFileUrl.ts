import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

function isImagePath(filePath: string) {
  return /\.(png|jpe?g|webp|gif|bmp)$/i.test(filePath.split("?")[0]);
}

async function getPreviewUrl(filePath: string) {
  return isImagePath(filePath) ? await u.oss.getSmallImageUrl(filePath) : await u.oss.getFileUrl(filePath);
}

export default router.post(
  "/",
  validateFields({
    items: z.array(
      z.object({
        id: z.number(),
        sources: z.string(),
      }),
    ),
  }),
  async (req, res) => {
    const { items } = req.body;
    const result: Record<string, string> = {};
    const totalFilePaths: { id: number; filePath: string; sources: string }[] = [];

    const storyboardIds = items.filter((item: any) => item.sources == "storyboard").map((item: any) => item.id);
    if (storyboardIds.length) {
      const storyBoardPaths = await u.db("o_storyboard").whereIn("id", storyboardIds).select("id", "filePath");
      totalFilePaths.push(
        ...storyBoardPaths
          .filter((i): i is { id: number; filePath: string } => typeof i.id === "number" && typeof i.filePath === "string")
          .map((i) => ({ id: i.id, filePath: i.filePath, sources: "storyboard" })),
      );
    }

    const assetsIds = items.filter((item: any) => item.sources == "assets").map((item: any) => item.id);
    if (assetsIds.length) {
      const assetsPaths = await u
        .db("o_assets")
        .leftJoin("o_image", "o_image.id", "o_assets.imageId")
        .whereIn("o_assets.id", assetsIds)
        .select("o_assets.id", "o_image.filePath");
      totalFilePaths.push(
        ...assetsPaths
          .filter((i): i is { id: number; filePath: string } => typeof i.id === "number" && typeof i.filePath === "string")
          .map((i) => ({ id: i.id, filePath: i.filePath, sources: "assets" })),
      );
    }

    await Promise.all(
      totalFilePaths.map(async (item) => {
        result[`${item.id}:${item.sources}`] = item.filePath ? await getPreviewUrl(item.filePath) : "";
      }),
    );

    res.status(200).send(success({ data: result }));
  },
);
