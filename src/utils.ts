import { glob } from "glob";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

export async function maskName(
  name: string,
  length: number = 7,
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
  const parts = path.split(/[\/]/);
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

export async function ensureEmptyFolder(path: string): Promise<string> {
  const normalizedPath = path.endsWith("/") ? path : path + "/";
  try {
    await rm(normalizedPath, { recursive: true, force: true });
  } catch (error) {
    console.error(`Error: Could not remove ${normalizedPath}!`, error);
  }
  await mkdir(normalizedPath, { recursive: true });
  return normalizedPath;
}


export function getRandomLine() {
  return Math.random().toString(36).substring(2) + "\n";
}

export async function searchPaths(input = "") {
  const base = input || ".";
  try {
    const matches = await glob(`${base}*`, {
      mark: true,
      dot: true,
      absolute: true,
    });

    return matches.map((match) => ({
      name: match.endsWith("/") ? `${match}` : match,
      value: path.resolve(match),
    }));
  } catch (_error) {
    return [];
  }
}

export async function safe<T>(
  operation: () => Promise<T> | T,
): Promise<T | undefined> {
  try {
    const data = await operation();
    return data;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
