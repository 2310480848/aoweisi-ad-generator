/**
 * AOWEISI vendor - LingkeAI Open API
 * @version 1.2
 */

type VideoMode =
  | "singleImage"
  | "startEndRequired"
  | "endFrameOptional"
  | "startFrameOptional"
  | "text"
  | (`videoReference:${number}` | `imageReference:${number}` | `audioReference:${number}`)[];

interface TextModel {
  name: string;
  modelName: string;
  type: "text";
  think: boolean;
}

interface ImageModel {
  name: string;
  modelName: string;
  type: "image";
  mode: ("text" | "singleImage" | "multiReference")[];
  associationSkills?: string;
}

interface VideoModel {
  name: string;
  modelName: string;
  type: "video";
  mode: VideoMode[];
  associationSkills?: string;
  audio: "optional" | false | true;
  durationResolutionMap: { duration: number[]; resolution: string[] }[];
}

interface TTSModel {
  name: string;
  modelName: string;
  type: "tts";
  voices: { title: string; voice: string }[];
}

interface VendorConfig {
  id: string;
  version: string;
  name: string;
  author: string;
  description?: string;
  icon?: string;
  inputs: { key: string; label: string; type: "text" | "password" | "url"; required: boolean; placeholder?: string }[];
  inputValues: Record<string, string>;
  models: (TextModel | ImageModel | VideoModel | TTSModel)[];
}

type ReferenceList =
  | { type: "image"; sourceType?: "base64" | "url"; base64: string; publicUrl?: string; expiresAt?: string }
  | { type: "audio"; sourceType?: "base64" | "url"; base64: string; publicUrl?: string; expiresAt?: string }
  | { type: "video"; sourceType?: "base64" | "url"; base64: string; publicUrl?: string; expiresAt?: string };

interface ImageConfig {
  prompt: string;
  referenceList?: Extract<ReferenceList, { type: "image" }>[];
  size: "1K" | "2K" | "4K";
  aspectRatio: `${number}:${number}`;
}

interface VideoConfig {
  duration: number;
  resolution: string;
  aspectRatio: "16:9" | "9:16";
  prompt: string;
  referenceList?: ReferenceList[];
  audio?: boolean;
  mode: VideoMode[];
}

interface TTSConfig {
  text: string;
  voice: string;
  speechRate: number;
  pitchRate: number;
  volume: number;
  referenceList?: Extract<ReferenceList, { type: "audio" }>[];
}

interface PollResult {
  completed: boolean;
  data?: string;
  error?: string;
}

declare const axios: any;
declare const logger: (msg: string) => void;
declare const urlToBase64: (url: string) => Promise<string>;
declare const base64ToFileUrl: (base64: string, fileType?: "image" | "audio" | "video") => Promise<string>;
declare const pollTask: (fn: () => Promise<PollResult>, interval?: number, timeout?: number) => Promise<PollResult>;
declare const createOpenAICompatible: any;
declare const exports: {
  vendor: VendorConfig;
  textRequest: (m: TextModel, t: boolean, tl: 0 | 1 | 2 | 3) => any;
  imageRequest: (c: ImageConfig, m: ImageModel) => Promise<string>;
  videoRequest: (c: VideoConfig, m: VideoModel) => Promise<string>;
  ttsRequest: (c: TTSConfig, m: TTSModel) => Promise<string>;
  checkForUpdates?: () => Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }>;
  updateVendor?: () => Promise<string>;
};

const textModels: TextModel[] = [
  ["GPT-5.5", "gpt-5.5"],
  ["GPT-5.4", "gpt-5.4"],
  ["Gemini 3.1 Pro", "gemini-3.1-pro-preview"],
  ["opus-4-8", "claude-opus-4-8"],
  ["Gemini 3.5 flash", "gemini-3.5-flash"],
  ["opus-4-7", "claude-opus-4-7"],
  ["GPT-5.5 深度推理", "gpt-5.5-xhigh"],
  ["opus-4-6", "claude-opus-4-6"],
  ["sonnet-4-6", "claude-sonnet-4-6"],
  ["Gemini 3 Pro", "gemini-3-pro-preview"],
  ["GPT-5.5 高推理", "gpt-5.5-high"],
  ["GPT-4o", "gpt-4o"],
  ["fable-5", "claude-fable-5"],
  ["GPT-5.4 深度推理", "gpt-5.4-xhigh"],
  ["Gemini 3 flash", "gemini-3-flash-preview"],
  ["GPT-5.3 Codex", "gpt-5.3-codex"],
  ["GPT-5.4 mini", "gpt-5.4-mini"],
  ["GPT-5.2 Codex", "gpt-5.2"],
  ["GPT-5.5 中推理", "gpt-5.5-medium"],
  ["claude-4-5", "claude-haiku-4-5-20251001"],
  ["opus-4-5", "claude-opus-4-5-20251101"],
  ["GPT-5.5 低推理", "gpt-5.5-low"],
  ["GPT-5.2 对话", "gpt-5.2-chat-latest"],
  ["GPT-5.3 对话", "gpt-5.3-chat-latest"],
  ["GPT-5.4 nano", "gpt-5.4-nano"],
].map(([name, modelName]) => ({
  name,
  modelName,
  type: "text",
  think: /reasoning|deepseek|xhigh|high|medium/i.test(`${name} ${modelName}`),
}));

const imageModels: ImageModel[] = [
  { name: "GPT Image 2", modelName: "gpt-image-2", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "Nano Banana Pro", modelName: "gemini-3-pro-image-preview", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "Nano Banana 2", modelName: "gemini-3.1-flash-image-preview", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "GPT Image 2 官转", modelName: "gpt-image-2-guan", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "VIDU Image 2", modelName: "vidu-image-2", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "即梦 5.0", modelName: "doubao-seedream-5-0-260128", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "Banana pro官转", modelName: "gemini-3-pro-image-preview-guan", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "Banana2 官转", modelName: "gemini-3.1-flash-image-preview-guan", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "万相 2.7 图像", modelName: "wan2.7-image", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "Midjourney", modelName: "mj_imagine", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "即梦 4.5", modelName: "doubao-seedream-4-5-251128", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "可灵-V3-Omni", modelName: "kling-v3-omni", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "grok-4.2-image", modelName: "grok-4.2-image", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "千问-image-max", modelName: "qwen-image", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "可灵-V3", modelName: "kling-v3", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "万相 2.6 图像", modelName: "wan2.6-image", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "grok-4.1-image", modelName: "grok-4.1-image", type: "image", mode: ["text", "singleImage", "multiReference"] },
  { name: "可灵 o1", modelName: "kling-image-o1", type: "image", mode: ["text", "singleImage", "multiReference"] },
];

const videoDurations = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

const videoModel = (name: string, modelName: string, mode: VideoMode[], audio: "optional" | false | true, resolution: string[]): VideoModel => ({
  name,
  modelName,
  type: "video",
  mode,
  audio,
  durationResolutionMap: [{ duration: videoDurations, resolution }],
});

const videoModels: VideoModel[] = [
  videoModel("grok-video-3.5", "grok-imagine-video-1.5-preview", ["singleImage", ["imageReference:5"]], true, ["720p", "1080p"]),
  {
    name: "Sora-2 官转版",
    modelName: "sora-2",
    type: "video",
    mode: ["text", "singleImage"],
    audio: false,
    durationResolutionMap: [{ duration: [4, 8, 12], resolution: ["1280x720", "720x1280"] }],
  },
  {
    name: "grok-video-3",
    modelName: "grok-video-3",
    type: "video",
    mode: ["text", "singleImage"],
    audio: false,
    durationResolutionMap: [{ duration: [6, 10], resolution: ["720P"] }],
  },
  videoModel("SD 2.0 参考生", "kwvideo-v2-ref", ["singleImage", ["imageReference:9"]], true, ["720p"]),
  videoModel("即梦 3.5 Pro", "doubao-seedance-1-5-pro-251215", ["text", "endFrameOptional", ["imageReference:5"]], true, ["720p", "1080p"]),
  {
    name: "可灵-Omni 参考生",
    modelName: "kling-v3-omni-cankao",
    type: "video",
    mode: ["text", ["imageReference:7"]],
    audio: true,
    durationResolutionMap: [{ duration: [5, 10, 15], resolution: ["std", "pro"] }],
  },
  videoModel("SD 2.0 全能参考", "kwvideo-v2-quannengcankao", [["imageReference:9", "videoReference:1", "audioReference:1"]], true, ["720p", "1080p"]),
  videoModel("快乐马-参考生", "happyhorse-r2v", [["imageReference:5"]], false, ["720p", "1080p"]),
  videoModel("快乐马1.1-参考生", "happyhorse-1.1-r2v", [["imageReference:5"]], false, ["720p", "1080p"]),
  videoModel("快乐马-视频编辑", "happyhorse-video-edit", [["videoReference:1", "imageReference:5"]], false, ["720p", "1080p"]),
  videoModel("快乐马1.1-文生视频", "happyhorse-1.1-t2v", ["text"], false, ["720p", "1080p"]),
  videoModel("SD 2.0 首尾帧", "kwvideo-v2", ["text", "endFrameOptional"], true, ["720p", "1080p"]),
  videoModel("veo3.1", "veo3.1", ["text", "endFrameOptional", ["imageReference:5"]], false, ["720p", "1080p"]),
  videoModel("快乐马-文生视频", "happyhorse-t2v", ["text"], false, ["720p", "1080p"]),
  videoModel("Vidu Q3", "viduq3", ["text", "endFrameOptional", ["imageReference:5"]], true, ["720p", "1080p"]),
  videoModel("Vidu Q3 Drama", "viduq3-drama", [["imageReference:7"]], true, ["720p", "1080p"]),
  videoModel("Vidu Q3 参考生", "viduq3-cankaosheng", [["imageReference:7"]], true, ["720p", "1080p"]),
  videoModel("Vidu Q3 Turbo 参考生", "viduq3-turbo-cankaosheng", ["text", ["imageReference:7"]], true, ["540p", "720p", "1080p"]),
  videoModel("veo3.1-4K高清", "veo3.1-4k", ["text", "endFrameOptional", ["imageReference:5"]], "optional", ["540p", "720p", "1080p", "4K"]),
  videoModel("快乐马1.1-首帧", "happyhorse-1.1-i2v", ["singleImage"], false, ["720p", "1080p"]),
  videoModel("快乐马-首帧", "happyhorse-i2v", ["singleImage"], false, ["720p", "1080p"]),
  videoModel("Pix V6 首尾帧", "pixverse-v6-shouweizhen", ["text", "endFrameOptional"], true, ["540p", "720p", "1080p"]),
  videoModel("可灵-动作控制 V3", "kling-motion-control-v3", [["imageReference:1", "videoReference:1"]], false, ["720p", "1080p"]),
  videoModel("可灵-Omni 首尾帧", "kling-v3-omni-shouweizhen", ["startEndRequired"], true, ["720p", "1080p"]),
  videoModel("omni-flash", "omni-flash", ["text", ["imageReference:5"]], true, ["720p", "1080p"]),
  videoModel("万相 2.6 首帧", "wan2.6-shouzheng", ["text", "singleImage", ["imageReference:5"]], true, ["720p", "1080p"]),
  videoModel("可灵-V3-video", "kling-v3-video", ["text", "endFrameOptional"], true, ["720p", "1080p"]),
  videoModel("可灵-动作控制", "kling-motion-control", [["imageReference:1", "videoReference:1"]], false, ["720p", "1080p"]),
  videoModel("万相 2.6 参考生", "wan2.6-cankaosheng", [["imageReference:5"]], false, ["720p", "1080p"]),
  videoModel("VIDU-音乐MV", "vidu-mv", [["imageReference:7", "audioReference:1"]], "optional", ["540p", "720p", "1080p"]),
  videoModel("可灵-Omni 视频参考", "kling-v3-omni-videoref", [["videoReference:1", "imageReference:5"]], "optional", ["720p", "1080p"]),
  videoModel("Omni Flash 10秒", "omni_flash-10s", ["text", ["imageReference:7"]], true, ["720p"]),
  videoModel("可灵-数字人", "kling-avatar-image2video", [["imageReference:1", "audioReference:1"]], "optional", ["720p", "1080p"]),
  videoModel("万相-视频换人", "wan2.2-animate-mix", [["imageReference:1", "videoReference:1"]], false, ["720p", "1080p"]),
  videoModel("万相 2.7 参考生", "wan2.7-cankaosheng", ["text", ["imageReference:5"]], false, ["720p", "1080p"]),
  {
    name: "Pix C1 参考生",
    modelName: "pixverse-c1-cankaosheng",
    type: "video",
    mode: ["text", ["imageReference:7"]],
    audio: true,
    durationResolutionMap: [{ duration: [3, 6, 9, 12, 15], resolution: ["360P", "540P", "720P", "1080P"] }],
  },
  videoModel("Vidu Q2 参考生", "viduq2-cankaosheng", [["videoReference:1", "imageReference:5"]], true, ["720p", "1080p"]),
  videoModel("Vidu Q3 Turbo", "viduq3-turbo", ["endFrameOptional"], true, ["540p", "720p", "1080p"]),
  videoModel("Pix C1 首尾帧", "pixverse-c1-shouweizhen", ["endFrameOptional"], true, ["540p", "720p", "1080p"]),
  videoModel("可灵 2.6 Pro", "kling-v2-6", ["text", "singleImage", ["imageReference:5"]], true, ["720p", "1080p"]),
  videoModel("Pix V5.6 参考生", "pixverse-v5.6-r2v", ["text", "singleImage", ["imageReference:7"]], true, ["540p", "720p", "1080p"]),
  videoModel("VIDU-解说漫", "vidu-jieshuoman", [["imageReference:10", "audioReference:10"]], "optional", ["720p", "1080p"]),
  videoModel("万相 2.7 首尾帧", "wan2.7-shouweizhen", ["endFrameOptional"], false, ["720p", "1080p"]),
  videoModel("Pix V5.6 首尾帧", "pixverse-v5.6-shouweizhen", ["text", "endFrameOptional"], true, ["540p", "720p", "1080p"]),
  videoModel("万相 2.7 视频续写", "wan2.7-xuxie", [["videoReference:1", "imageReference:1"]], false, ["720p", "1080p"]),
  videoModel("veo3.1-lite", "veo3.1-lite", ["text", "endFrameOptional"], "optional", ["540p", "720p", "1080p", "4K"]),
  videoModel("海螺 2.3", "hailuo-2.3", ["text", "singleImage"], false, ["720p", "1080p"]),
];

const defaultVoices = [{ title: "Default", voice: "default" }];

const ttsModels: TTSModel[] = [
  { name: "Doubao TTS 2.0", modelName: "doubao-tts-2.0", type: "tts", voices: defaultVoices },
  { name: "Gemini 3.1 TTS", modelName: "gemini-3.1-flash-tts-preview", type: "tts", voices: defaultVoices },
  { name: "Gemini 2.5 TTS", modelName: "gemini-2.5-pro-preview-tts", type: "tts", voices: defaultVoices },
  { name: "Hailuo Voice Clone 2.8", modelName: "speech-2.8", type: "tts", voices: defaultVoices },
];

const vendor: VendorConfig = {
  id: "lingkeai",
  version: "1.2",
  author: "LingkeAI",
  name: "LingkeAI Open API",
  description:
    "LingkeAI model service from https://api.lk888.ai. Text and TTS use OpenAI-compatible endpoints; image and video use POST /v1/media/generate plus GET /v1/media/status.",
  inputs: [
    { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "LingkeAI API Key" },
    { key: "baseUrl", label: "Base URL", type: "url", required: true, placeholder: "https://api.lk888.ai/v1" },
    { key: "assetBaseUrl", label: "Asset Base URL", type: "url", required: false, placeholder: "https://your-domain.com/oss" },
  ],
  inputValues: {
    apiKey: "",
    baseUrl: "https://api.lk888.ai/v1",
    assetBaseUrl: "",
  },
  models: [...textModels, ...imageModels, ...videoModels, ...ttsModels],
};

const getBaseUrl = () => vendor.inputValues.baseUrl.replace(/\/+$/, "");

const getApiKey = () => {
  if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
  return vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
};

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getApiKey()}`,
});

const readByPath = (obj: any, path: string): any => {
  if (!obj) return undefined;
  return path.replace(/\[(\d+)\]/g, ".$1").split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
};

const pickFirstPath = (obj: any, paths: string[]): any => {
  for (const path of paths) {
    const value = readByPath(obj, path);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const extractTaskId = (data: any): string | undefined => {
  const id = pickFirstPath(data, ["data.id", "data.task_id", "data.taskId", "Resp.video_id", "output.task_id", "output.taskId", "id", "task_id", "taskId"]);
  if (id !== undefined) return String(id);

  const ids = pickFirstPath(data, ["data.任务ids", "任务ids"]);
  if (Array.isArray(ids) && ids[0] !== undefined && ids[0] !== null) return String(ids[0]);

  const scalarData = readByPath(data, "data");
  if (typeof scalarData === "string" || typeof scalarData === "number") return String(scalarData);
  return undefined;
};

const extractMedia = (data: any): string | undefined => {
  const direct = pickFirstPath(data, [
    "data.result_url",
    "result_url",
    "data.result_urls[0]",
    "result_urls[0]",
    "data.urls[0]",
    "urls[0]",
    "data.url",
    "data.image_url",
    "data.video_url",
    "data.audio_url",
    "data.output.url",
    "data.result.url",
    "data.file.url",
    "data.media.url",
    "data.output",
    "data.result",
    "url",
    "image_url",
    "video_url",
    "audio_url",
    "output",
    "result",
    "data[0].url",
    "data[0].b64_json",
  ]);
  if (typeof direct === "string") return direct;

  const outputs = pickFirstPath(data, ["data.outputs", "outputs", "data.files", "files"]);
  if (Array.isArray(outputs) && outputs.length > 0) {
    const first = outputs[0];
    if (typeof first === "string") return first;
    return pickFirstPath(first, ["url", "image_url", "video_url", "audio_url", "b64_json"]);
  }
  return undefined;
};

const extractStatus = (data: any): string => {
  return String(pickFirstPath(data, ["data.status", "data.state", "status", "state", "data.fenzu", "fenzu"]) || "").toLowerCase();
};

const extractStatusGroup = (data: any): string => {
  return String(pickFirstPath(data, ["data.status_group", "status_group"]) || "").toLowerCase();
};

const extractState = (data: any): string => {
  return String(pickFirstPath(data, ["data.state", "state"]) || "").toLowerCase();
};

const isFinalStatus = (data: any): boolean => {
  const value = pickFirstPath(data, ["data.is_final", "is_final"]);
  return value === true || value === 1 || value === "1" || value === "true";
};

const extractError = (data: any): string | undefined => {
  return pickFirstPath(data, ["data.error.message", "data.error", "data.message", "data.msg", "error.message", "error", "message", "msg"]);
};

const normalizeSize = (config: ImageConfig): string => {
  const ratio = config.aspectRatio || "1:1";
  if (ratio === "16:9") return config.size === "4K" ? "3840x2160" : config.size === "2K" ? "2048x1152" : "1344x768";
  if (ratio === "9:16") return config.size === "4K" ? "2160x3840" : config.size === "2K" ? "1152x2048" : "768x1344";
  if (ratio === "4:3") return config.size === "4K" ? "3072x2304" : config.size === "2K" ? "2048x1536" : "1024x768";
  if (ratio === "3:4") return config.size === "4K" ? "2304x3072" : config.size === "2K" ? "1536x2048" : "768x1024";
  return config.size === "4K" ? "3072x3072" : config.size === "2K" ? "2048x2048" : "1024x1024";
};

const toBase64 = async (value: string): Promise<string> => {
  if (value.startsWith("data:")) return value;
  if (/^https?:\/\//i.test(value)) return await urlToBase64(value);
  return value;
};

const toPublicRefs = async (refs: ReferenceList[], fileType: "image" | "audio" | "video"): Promise<string[]> => {
  const configuredBaseUrl = vendor.inputValues.assetBaseUrl?.replace(/\/+$/, "") || "";
  const baseUrl = /trycloudflare\.com/i.test(configuredBaseUrl) ? "" : configuredBaseUrl;
  const urls = await Promise.all(
    refs.map(async (ref) => {
      const publicRef = ref.publicUrl || (/^https?:\/\//i.test(ref.base64) ? ref.base64 : "");
      if (publicRef) return publicRef;
      const url = await base64ToFileUrl(ref.base64, fileType);
      if (!baseUrl && (url.startsWith("/") || /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(url))) {
        throw new Error("LingkeAI reference media needs a public URL. Set Asset Base URL to your public /oss address.");
      }
      if (!baseUrl) return url;
      const path = url.replace(/^https?:\/\/[^/]+\/oss/i, "").replace(/^\/oss/i, "");
      return `${baseUrl}${path}`;
    }),
  );
  const errors: string[] = [];
  const checked = await Promise.all(
    urls.map(async (url) => {
      if (!/^https?:\/\//i.test(url)) return url;
      try {
        await axios.head(url, { timeout: 8000 });
        return url;
      } catch (e: any) {
        const message = `${url}: ${e?.message || String(e)}`;
        errors.push(message);
        logger(`[LingkeAI refs] skip unreachable ${fileType} reference: ${message}`);
        return "";
      }
    }),
  );
  const result = checked.filter(Boolean);
  if (refs.length > 0 && result.length === 0 && errors.length > 0) {
    throw new Error(`LingkeAI ${fileType} reference URLs are unreachable. Check Asset Base URL. ${errors[0]}`);
  }
  return result;
};

const normalizeResolution = (value: string): "720P" | "1080P" => (/1080/i.test(value) ? "1080P" : "720P");

const normalizeViduQ3Duration = (value: number): "4" | "8" | "12" | "16" => {
  const allowed = [4, 8, 12, 16];
  const duration = allowed.reduce((best, item) => (Math.abs(item - value) < Math.abs(best - value) ? item : best), 4);
  return String(duration) as "4" | "8" | "12" | "16";
};

const normalizeViduQ3Resolution = (value: string): "540p" | "720p" | "1080p" => {
  if (/1080/i.test(value)) return "1080p";
  if (/540/i.test(value)) return "540p";
  return "720p";
};

const normalizeSoraDuration = (value: number): "4" | "8" | "12" => {
  const allowed = [4, 8, 12];
  const duration = allowed.reduce((best, item) => (Math.abs(item - value) < Math.abs(best - value) ? item : best), 4);
  return String(duration) as "4" | "8" | "12";
};

const normalizeKlingOmniDuration = (value: number): "5" | "10" | "15" => {
  const allowed = [5, 10, 15];
  const duration = allowed.reduce((best, item) => (Math.abs(item - value) < Math.abs(best - value) ? item : best), 5);
  return String(duration) as "5" | "10" | "15";
};

const normalizeGrokVideo3Duration = (value: number): "6" | "10" => {
  const allowed = [6, 10];
  const duration = allowed.reduce((best, item) => (Math.abs(item - value) < Math.abs(best - value) ? item : best), 6);
  return String(duration) as "6" | "10";
};

const normalizePixC1Duration = (value: number): "3" | "6" | "9" | "12" | "15" => {
  const allowed = [3, 6, 9, 12, 15];
  const duration = allowed.reduce((best, item) => (Math.abs(item - value) < Math.abs(best - value) ? item : best), 3);
  return String(duration) as "3" | "6" | "9" | "12" | "15";
};

const normalizePixC1Resolution = (value: string): "360P" | "540P" | "720P" | "1080P" => {
  if (/1080/i.test(value)) return "1080P";
  if (/720/i.test(value)) return "720P";
  if (/540/i.test(value)) return "540P";
  return "360P";
};

const modeRequiresImage = (mode: any): boolean => {
  const entries = (Array.isArray(mode) ? mode : [mode]).flatMap((item) => (Array.isArray(item) ? item : [item]));
  return entries.some((entry) => entry === "singleImage" || entry === "startEndRequired" || /^imageReference:\d+$/i.test(String(entry || "")));
};

const axiosWithRetry = async (fn: () => Promise<any>) => {
  try {
    return await fn();
  } catch (e: any) {
    if (!/(EAI_AGAIN|ENOTFOUND|ECONNRESET|ETIMEDOUT|timeout)/i.test(`${e?.code || ""} ${e?.message || ""}`)) throw e;
    logger(`[LingkeAI network] retry after ${e?.code || e?.message || e}`);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return await fn();
  }
};

const submitMediaTask = async (body: Record<string, any>, timeout: number): Promise<string> => {
  const response = await axiosWithRetry(() => axios.post(`${getBaseUrl()}/media/generate`, body, { headers: getHeaders(), timeout: 60000 }));
  const submitData = response.data;
  const immediate = extractMedia(submitData);
  if (immediate) return await toBase64(immediate);

  const taskId = extractTaskId(submitData);
  if (!taskId) {
    throw new Error(`LingkeAI media task failed: no task id. Response: ${JSON.stringify(submitData).slice(0, 500)}`);
  }

  const result = await pollTask(
    async (): Promise<PollResult> => {
      const statusResp = await axiosWithRetry(() =>
        axios.get(`${getBaseUrl()}/media/status`, {
          headers: getHeaders(),
          params: { task_id: taskId },
          timeout: 30000,
        }),
      );
      const statusData = statusResp.data;
      const state = extractState(statusData);
      const status = extractStatus(statusData);
      const statusGroup = extractStatusGroup(statusData);
      const media = extractMedia(statusData);
      if (state === "success" && media) return { completed: true, data: media };

      if (
        state === "failed" ||
        status.includes("failed") ||
        status.includes("failure") ||
        status.includes("error") ||
        status.includes("cancelled") ||
        status.includes("canceled") ||
        status.includes("expired") ||
        status.includes("\u5931\u8d25") ||
        status.includes("\u9519\u8bef") ||
        statusGroup.includes("\u5931\u8d25") ||
        statusGroup.includes("\u9519\u8bef") ||
        status.includes("??") ||
        statusGroup.includes("??")
      ) {
        return { completed: true, error: extractError(statusData) || "LingkeAI media task failed" };
      }
      if (
        state === "success" ||
        isFinalStatus(statusData) ||
        status.includes("success") ||
        status.includes("succeeded") ||
        status.includes("completed") ||
        status.includes("complete") ||
        status.includes("done") ||
        status.includes("finished") ||
        status.includes("??") ||
        status.includes("??") ||
        statusGroup.includes("??") ||
        statusGroup.includes("??")
      ) {
        return {
          completed: true,
          error: `LingkeAI task completed without media result. Response: ${JSON.stringify(statusData).slice(0, 500)}`,
        };
      }
      return { completed: false };
    },
    5000,
    timeout,
  );

  if (result.error) throw new Error(result.error);
  if (!result.data) throw new Error("LingkeAI media task timed out without result");
  return await toBase64(result.data);
};

const textRequest = (model: TextModel) => {
  return createOpenAICompatible({
    name: "lingkeai",
    baseURL: getBaseUrl(),
    apiKey: getApiKey(),
  }).chatModel(model.modelName);
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  const imageRefs = await toPublicRefs(config.referenceList || [], "image");
  logger(`[LingkeAI image] submit ${model.modelName}, refs=${imageRefs.length}`);
  return await submitMediaTask(
    {
      model: model.modelName,
      input: config.prompt || "",
      prompt: config.prompt || "",
      type: "image",
      size: normalizeSize(config),
      aspect_ratio: config.aspectRatio || "1:1",
      images: imageRefs,
    },
    600000,
  );
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  const refs = config.referenceList || [];
  const imageRefs = await toPublicRefs(refs.filter((ref) => ref.type === "image"), "image");
  if (modeRequiresImage(config.mode) && imageRefs.length < 1) {
    throw new Error(`${model.name} requires one reference image`);
  }
  if (model.modelName === "viduq3-cankaosheng" && imageRefs.length < 1) {
    throw new Error(`${model.name} requires 1-7 reference images`);
  }

  if (model.modelName === "sora-2") {
    const aspectRatio = config.aspectRatio === "9:16" ? "9:16" : "16:9";
    const duration = normalizeSoraDuration(Number(config.duration) || 4);
    const params: Record<string, any> = {
      duration,
      orientation: aspectRatio === "9:16" ? "portrait" : "landscape",
      aspect_ratio: aspectRatio,
      size: aspectRatio === "9:16" ? "720x1280" : "1280x720",
      seconds: duration,
    };
    if (imageRefs[0]) params.input_reference = imageRefs[0];
    logger(`[LingkeAI video] submit ${model.modelName}, images=${imageRefs.length}`);
    return await submitMediaTask(
      {
        model: model.modelName,
        prompt: config.prompt || "",
        params,
      },
      4200000,
    );
  }

  if (model.modelName === "kling-v3-omni-cankao") {
    const params: Record<string, any> = {
      duration: normalizeKlingOmniDuration(Number(config.duration) || 5),
      images: imageRefs.slice(0, 7),
      mode: config.resolution === "pro" ? "pro" : "std",
      aspect_ratio: config.aspectRatio || "16:9",
    };
    logger(`[LingkeAI video] submit ${model.modelName}, images=${imageRefs.length}`);
    return await submitMediaTask(
      {
        model: model.modelName,
        prompt: config.prompt || "",
        params,
      },
      4200000,
    );
  }

  if (model.modelName === "grok-video-3") {
    const aspectRatios = ["9:16", "16:9", "2:3", "3:2", "1:1"];
    const aspectRatio = aspectRatios.includes(config.aspectRatio) ? config.aspectRatio : "16:9";
    const params: Record<string, any> = {
      aspect_ratio: aspectRatio,
      size: "720P",
      duration: normalizeGrokVideo3Duration(Number(config.duration) || 6),
    };
    if (imageRefs[0]) params.images = imageRefs.slice(0, 1);
    logger(`[LingkeAI video] submit ${model.modelName}, images=${imageRefs.length}`);
    return await submitMediaTask(
      {
        model: model.modelName,
        prompt: config.prompt || "",
        params,
      },
      4200000,
    );
  }

  if (model.modelName === "pixverse-c1-cankaosheng") {
    const aspectRatios = ["16:9", "9:16", "1:1", "3:4", "4:3", "3:2", "2:3", "21:9"];
    const aspectRatio = aspectRatios.includes(config.aspectRatio) ? config.aspectRatio : "16:9";
    const params: Record<string, any> = {
      resolution: normalizePixC1Resolution(config.resolution || "720P"),
      duration: normalizePixC1Duration(Number(config.duration) || 3),
      aspect_ratio: aspectRatio,
    };
    if (imageRefs.length > 0) params.images = imageRefs.slice(0, 7);
    logger(`[LingkeAI video] submit ${model.modelName}, images=${imageRefs.length}`);
    return await submitMediaTask(
      {
        model: model.modelName,
        prompt: config.prompt || "",
        params,
      },
      4200000,
    );
  }

  const isHappyHorse = /^happyhorse/i.test(model.modelName);
  const isViduQ3Reference = model.modelName === "viduq3-cankaosheng";
  const duration = Math.max(isHappyHorse ? 3 : 4, Math.min(15, Number(config.duration) || (isHappyHorse ? 5 : 4)));
  const ratio = config.aspectRatio || "16:9";
  const params: Record<string, any> = isHappyHorse
    ? {
        duration: String(duration),
        resolution: normalizeResolution(config.resolution || "720P"),
        ratio,
        aspect_ratio: ratio,
        images: imageRefs.slice(0, 5),
      }
    : isViduQ3Reference
    ? {
        model_version: "viduq3",
        duration: normalizeViduQ3Duration(Number(config.duration) || 4),
        resolution: normalizeViduQ3Resolution(config.resolution || "720p"),
        aspect_ratio: config.aspectRatio || "auto",
        images: imageRefs.slice(0, 7),
        off_peak: false,
      }
    : {
        version: "\u5feb\u901f",
        duration: String(duration),
        aspect_ratio: config.aspectRatio || "adaptive",
        images: imageRefs.slice(0, 9),
      };
  logger(`[LingkeAI video] submit ${model.modelName}, images=${imageRefs.length}`);
  return await submitMediaTask(
    {
      model: model.modelName,
      prompt: config.prompt || "",
      params,
    },
    4200000,
  );
};

const ttsRequest = async (config: TTSConfig, model: TTSModel): Promise<string> => {
  return await submitMediaTask(
    {
      model: model.modelName,
      prompt: config.text,
      params: {
        voice: config.voice || "default",
        speed: Math.max(0.25, Math.min(4, Number(config.speechRate) || 1)),
        pitch: Number(config.pitchRate) || 1,
        volume: Number(config.volume) || 1,
      },
    },
    600000,
  );
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return { hasUpdate: false, latestVersion: vendor.version, notice: "" };
};

const updateVendor = async (): Promise<string> => "";

exports.vendor = vendor;
exports.textRequest = textRequest;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;
exports.checkForUpdates = checkForUpdates;
exports.updateVendor = updateVendor;

export {};
