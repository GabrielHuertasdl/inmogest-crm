import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/db";

const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", svg: "image/svg+xml" };

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  if (parts.some((p) => p === ".." || p.includes("\\") || p.includes("\0"))) return new Response("Bad request", { status: 400 });
  const abs = path.resolve(UPLOADS_DIR, ...parts);
  if (!abs.startsWith(UPLOADS_DIR + path.sep)) return new Response("Bad request", { status: 400 });
  const ext = path.extname(abs).slice(1).toLowerCase();
  const type = TYPES[ext];
  if (!type) return new Response("Not found", { status: 404 });
  try {
    const s = await stat(abs);
    if (!s.isFile()) throw new Error();
    const body = await readFile(abs);
    return new Response(body, {
      headers: {
        "content-type": type,
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
        ...(ext === "svg" ? { "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'" } : {}),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
