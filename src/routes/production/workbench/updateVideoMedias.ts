import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    id: z.number(),
    medias: z.array(
      z.object({
        id: z.number().nullable().optional(),
        sources: z.string().optional(),
        src: z.string().optional(),
        path: z.string().optional(),
        prompt: z.string().optional().nullable(),
        fileType: z.enum(["image", "video", "audio"]).optional(),
        index: z.number().optional(),
      }),
    ),
  }),
  async (req, res) => {
    const { id, medias } = req.body;
    await u.db("o_videoTrack").where("id", id).update({ medias: JSON.stringify(medias) });
    res.status(200).send(success("更新成功"));
  },
);
