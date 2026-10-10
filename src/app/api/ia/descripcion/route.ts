import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSession } from "@/lib/auth/session";
import { generateDescription, type DescInput } from "@/lib/ai";
import { parseJsonArray } from "@/lib/format";

export async function POST(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const lang = b.lang === "en" ? "en" : "es";
  let input: DescInput;
  if (b.propertyId) {
    const p = db.select().from(schema.properties).where(eq(schema.properties.id, Number(b.propertyId))).get();
    if (!p) return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
    input = { ...p, features: parseJsonArray(p.features) };
  } else {
    const s = (x: unknown) => (typeof x === "string" ? x.slice(0, 200) : null);
    const n = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : null);
    input = {
      type: s(b.type) ?? "piso",
      operation: s(b.operation) ?? "venta",
      city: s(b.city),
      zone: s(b.zone),
      areaBuilt: n(b.areaBuilt),
      rooms: n(b.rooms),
      baths: n(b.baths),
      floor: s(b.floor),
      condition: s(b.condition),
      features: Array.isArray(b.features) ? b.features.filter((f: unknown) => typeof f === "string").slice(0, 30) : [],
      price: n(b.price),
      title: s(b.title),
    };
  }
  return NextResponse.json(await generateDescription(input, lang));
}
