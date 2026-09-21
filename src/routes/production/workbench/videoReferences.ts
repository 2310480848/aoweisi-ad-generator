import u from "@/utils";
import { ReferenceList } from "@/utils/ai";
import { decodeBase64Data } from "@/utils/base64";

export type ParsedVideoMode = (string | string[])[];
export type VideoReferenceInput = { id?: number | null; sources?: string; path?: string; src?: string; fileType?: string };
export type ResolvedReference = { path: string; sources: string };
export type TransferSetting = { baseUrl?: string; token?: string };

const referenceFallbackKeywords = [
  "无法读取文件",
  "参考图内容问题",
  "file content read failed",
  "invalid reference",
  "base64 unsupported",
  "reference media needs a public url",
  "reference urls are unreachable",
  "asset base url",
  "getaddrinfo enotfound",
];

export function normalizeTransferSetting(value: unknown): TransferSetting | undefined {
  if (!value || typeof value !== "object") return undefined;
  const setting = value as TransferSetting;
  const baseUrl = String(setting.baseUrl || "").trim().replace(/\/+$/, "");
  const token = String(setting.token || "").trim();
  if (!baseUrl || !token || !/^https?:\/\//i.test(baseUrl)) return undefined;
  return { baseUrl, token };
}

export function hasTransferSetting(value: unknown): value is TransferSetting {
  return Boolean(normalizeTransferSetting(value));
}

export function isReferenceFallbackError(error: unknown): boolean {
  const message = u.error(error).message.toLowerCase();
  return referenceFallbackKeywords.some((keyword) => message.includes(keyword.toLowerCase()));
}

export function mediaTypeFromPath(path: string): "image" | "video" | "audio" {
  const ext = path.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "aac", "flac", "m4a"].includes(ext)) return "audio";
  return "image";
}

export function normalizeReferenceType(source: string | undefined, path: string): "image" | "video" | "audio" {
  if (source === "audio" || source === "video" || source === "image") return source;
  return mediaTypeFromPath(path);
}

export function parseVideoMode(mode: unknown): ParsedVideoMode {
  if (Array.isArray(mode)) return [mode.map(String)];
  if (typeof mode === "string" && mode.startsWith("[") && mode.endsWith("]")) {
    try {
      const parsed = JSON.parse(mode);
      if (Array.isArray(parsed)) return [parsed.map(String)];
    } catch {}
  }
  return [String(mode || "text")];
}

export function needsImageReferences(model: string, mode: ParsedVideoMode): boolean {
  if (model.endsWith(":viduq3-cankaosheng")) return true;
  return mode.some((item) => Array.isArray(item) && item.some((entry) => /^imageReference:\d+$/i.test(entry)));
}

function parseMedias(value: unknown): VideoReferenceInput[] {
  if (!value || typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function resolveVideoReferences(
  input: VideoReferenceInput[],
  projectId: number,
  scriptId: number,
  trackId: number,
  model: string,
  mode: ParsedVideoMode,
): Promise<ResolvedReference[]> {
  let refs = input;
  if (!refs.length) {
    const track = await u.db("o_videoTrack").where({ id: trackId, projectId, scriptId }).select("medias").first();
    refs = parseMedias(track?.medias);
  }

  const resolved = await Promise.all(
    refs.map(async (item) => {
      if (item.sources === "storyboard" && item.id) {
        const row = await u.db("o_storyboard").where("id", item.id).select("filePath").first();
        return { path: row?.filePath, sources: "image" };
      }
      if (item.sources === "assets" && item.id) {
        const row = await u
          .db("o_assets")
          .where("o_assets.id", item.id)
          .leftJoin("o_image", "o_assets.imageId", "o_image.id")
          .select("o_image.filePath", "o_image.type")
          .first();
        if (!row?.filePath) return undefined;
        return { path: row.filePath, sources: normalizeReferenceType(item.fileType || row?.type, row.filePath) };
      }
      if (item.sources === "upload") {
        const path = item.path || item.src;
        if (!path) return undefined;
        return { path, sources: normalizeReferenceType(item.fileType, path) };
      }
    }),
  );

  const valid = resolved
    .filter((item): item is { path: string; sources: string } => typeof item?.path === "string" && item.path.length > 0)
    .map((item) => ({ path: item.path, sources: item.sources || "storyBoard" }));
  const hasImageRef = valid.some((item) => item.sources === "image");
  if (!needsImageReferences(model, mode) || hasImageRef) return valid;

  const storyboardImages = await u
    .db("o_storyboard")
    .where({ projectId, scriptId, trackId })
    .whereNotNull("filePath")
    .whereNot("filePath", "")
    .orderBy("index", "asc")
    .limit(7)
    .select("filePath");

  const fallback = storyboardImages
    .map((item) => ({ path: item.filePath, sources: "storyBoard" }))
    .filter((item): item is ResolvedReference => typeof item.path === "string" && item.path.length > 0);
  return [...valid, ...fallback];
}

export async function resolveVideoReferenceList(
  input: VideoReferenceInput[],
  projectId: number,
  scriptId: number,
  trackId: number,
  model: string,
  mode: ParsedVideoMode,
): Promise<ReferenceList[]> {
  const references = await resolveVideoReferences(input, projectId, scriptId, trackId, model, mode);
  const base64 = await Promise.all(
    references.map(async (item) => ({
      base64: await u.oss.getImageBase64(item.path),
      type: normalizeReferenceType(item.sources, item.path),
    })),
  );
  return base64.filter(Boolean) as ReferenceList[];
}

function mimeFromDataUrl(value: string, type: ReferenceList["type"]): string {
  const match = value.match(/^data:([^;]+);base64,/i);
  if (match?.[1]) return match[1].toLowerCase();
  if (type === "audio") return "audio/mpeg";
  if (type === "video") return "video/mp4";
  return "image/png";
}

function extensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/mp4": "m4a",
    "audio/ogg": "ogg",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return map[mime] || "bin";
}

function summarizeTransferUploadError(status: number, body: string, statusText: string): string {
  const message = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || statusText;
  if (status >= 500) {
    return `Public transfer service is unavailable (${status}). Configure LingkeAI Asset Base URL to a public /oss address and retry.`;
  }
  return `Public transfer upload failed (${status}) ${message}`.slice(0, 500);
}

async function uploadTransferReference(reference: ReferenceList, transferSetting: TransferSetting): Promise<ReferenceList> {
  const setting = normalizeTransferSetting(transferSetting);
  if (!setting) throw new Error("Public transfer is not configured");

  const existingUrl = reference.publicUrl || (/^https?:\/\//i.test(reference.base64) ? reference.base64 : "");
  if (existingUrl) return { ...reference, sourceType: "url", publicUrl: existingUrl, base64: existingUrl };

  const buffer = decodeBase64Data(reference.base64);
  if (!buffer) throw new Error("Reference media is not valid base64 and cannot be uploaded to public transfer");

  const mime = mimeFromDataUrl(reference.base64, reference.type);
  const form = new FormData();
  form.append("file", new Blob([buffer as any], { type: mime }), `reference.${extensionFromMime(mime)}`);

  const response = await fetch(`${setting.baseUrl}/api/ai-ad-transfer/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${setting.token}` },
    body: form,
  });
  const text = await response.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }
  if (!response.ok || !data?.url) {
    throw new Error(summarizeTransferUploadError(response.status, data?.error || data?.message || text, response.statusText));
  }

  const url = String(data.publicUrl || data.url);
  return { ...reference, sourceType: "url", base64: url, publicUrl: url, expiresAt: data.expiresAt };
}

export async function uploadReferenceListToTransfer(referenceList: ReferenceList[], transferSetting: TransferSetting): Promise<ReferenceList[]> {
  if (!referenceList.length) return referenceList;
  return Promise.all(referenceList.map((reference) => uploadTransferReference(reference, transferSetting)));
}
