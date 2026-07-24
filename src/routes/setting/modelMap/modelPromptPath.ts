import u from "@/utils";
import fs from "fs/promises";
import path from "path";

export function isSafePromptName(name: string) {
  return path.basename(name) === name && !name.includes("/") && !name.includes("\\");
}

export function resolveModelPromptPath(...parts: string[]) {
  const root = path.resolve(u.getPath(["modelPrompt"]));
  const filePath = path.resolve(root, ...parts);
  return filePath.startsWith(root + path.sep) ? filePath : null;
}

export async function isMarkdownFile(filePath: string) {
  if (!filePath.toLowerCase().endsWith(".md")) return false;
  try {
    return (await fs.stat(filePath)).isFile();
  } catch {
    return false;
  }
}
