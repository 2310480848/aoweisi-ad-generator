export function decodeBase64Data(value: string): Buffer | null {
  const raw = value.replace(/^data:[^;]+;base64,/, "");
  if (!raw || !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) return null;
  const padded = raw.padEnd(Math.ceil(raw.length / 4) * 4, "=");
  const buffer = Buffer.from(padded, "base64");
  return buffer.length ? buffer : null;
}
