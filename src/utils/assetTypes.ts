const ASSET_TYPE_ALIASES: Record<string, string> = {
  role: "person",
  "角色": "person",
  person: "person",
  "人物": "person",
  tool: "prop",
  "道具": "prop",
  prop: "prop",
  product: "product",
  "产品": "product",
  scene: "scene",
  "场景": "scene",
};

export function normalizeAssetType(type: string) {
  return ASSET_TYPE_ALIASES[type] ?? type;
}

export function getAssetQueryTypes(type: string) {
  const normalizedType = normalizeAssetType(type);
  if (normalizedType === "person") return ["person", "role", "角色"];
  if (normalizedType === "prop") return ["prop", "tool", "道具"];
  if (normalizedType === "scene") return ["scene", "场景"];
  if (normalizedType === "product") return ["product", "产品"];
  return [normalizedType];
}

export function getAssetPromptType(type: string) {
  const normalizedType = normalizeAssetType(type);
  if (normalizedType === "person") return "person";
  if (normalizedType === "prop" || normalizedType === "product") return "prop";
  if (normalizedType === "scene") return "scene";
  return "person";
}

export function isImageAssetType(type: string) {
  return ["product", "person", "prop", "scene"].includes(normalizeAssetType(type));
}
