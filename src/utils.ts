import { ensureDir } from "@std/fs";

export async function maskName(
  name: string,
  length: number = 8,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(name);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

export async function maskPath(path: string): Promise<string> {
  const parts = path.split(/[\/\\]/);
  const ext = parts[parts.length - 1].includes(".")
    ? "." + parts[parts.length - 1].split(".").pop()
    : "";

  const maskedParts = await Promise.all(
    parts.map(async (part, i) =>
      i === parts.length - 1
        ? await maskName(part.split(".")[0])
        : await maskName(part)
    ),
  );

  return maskedParts.join("/") + ext;
}

export async function clearFolder(path: string): Promise<string> {
  const normalizedPath = path.endsWith("/") ? path : path + "/";
  try {
    Deno.removeSync(normalizedPath, { recursive: true });
  } catch {}
  await ensureDir(normalizedPath);
  return normalizedPath;
}
export function getRandomLine() {
  return Math.random().toString(36).substring(2) + "\n";
}
