import "server-only";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { UPLOADS_DIR } from "@/db";

const SIGS: { ext: string; test: (b: Buffer) => boolean }[] = [
  { ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "webp", test: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
];
export const MAX_UPLOAD = 10 * 1024 * 1024;

/** Validate by magic bytes and store under uploads/<dir>. Returns the relative path or throws. */
export async function saveImage(file: File, dir: string) {
  if (file.size > MAX_UPLOAD) throw new Error(`"${file.name}" supera los 10 MB`);
  const buf = Buffer.from(await file.arrayBuffer());
  const sig = SIGS.find((s) => s.test(buf));
  if (!sig) throw new Error(`"${file.name}" no es una imagen JPG, PNG o WEBP válida`);
  const safeDir = dir.replace(/[^a-z0-9/_-]/gi, "");
  mkdirSync(path.join(UPLOADS_DIR, safeDir), { recursive: true });
  const rel = `${safeDir}/${randomUUID()}.${sig.ext}`;
  writeFileSync(path.join(UPLOADS_DIR, rel), buf);
  return rel;
}

export function removeUpload(rel: string | null | undefined) {
  if (!rel) return;
  const abs = path.resolve(UPLOADS_DIR, rel);
  if (abs.startsWith(UPLOADS_DIR + path.sep)) rmSync(abs, { force: true });
}

export const fileUrl = (rel: string | null | undefined) => (rel ? `/files/${rel}` : null);
