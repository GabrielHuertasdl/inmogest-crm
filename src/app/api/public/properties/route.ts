import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { coversFor } from "@/lib/queries/properties";
import { toPublic } from "@/lib/queries/public";

/** Public lookup by refs (favourites page). Only web-published, active listings. */
export async function GET(req: Request) {
  const refs = (new URL(req.url).searchParams.get("refs") ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter((r) => /^[A-Z0-9-]{1,20}$/i.test(r))
    .slice(0, 50);
  if (!refs.length) return NextResponse.json({ properties: [] });
  const P = schema.properties;
  const rows = db.select().from(P).where(and(inArray(P.ref, refs), eq(P.publishedWeb, true), inArray(P.status, ["disponible", "reservado"]))).all();
  const covers = coversFor(rows.map((r) => r.id));
  return NextResponse.json({ properties: rows.map((r) => toPublic(r, covers[r.id] ?? null)) });
}
