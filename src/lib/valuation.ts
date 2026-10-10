import "server-only";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalize } from "@/lib/format";

export type ValuationInput = { type: string; operation: string; city?: string | null; zone?: string | null; area: number; rooms?: number | null; baths?: number | null; condition: string; excludeId?: number };

const COND: Record<string, number> = { nuevo: 1.08, buen_estado: 1, a_reformar: 0.85 };
const q = (arr: number[], p: number) => {
  const s = [...arr].sort((a, b) => a - b);
  const i = (s.length - 1) * p;
  const lo = Math.floor(i),
    hi = Math.ceil(i);
  return s[lo]! + (s[hi]! - s[lo]!) * (i - lo);
};

/** Comparable-based estimate: median €/m² of similar listings (zone → city → any), adjusted by condition. */
export function estimate(i: ValuationInput) {
  const P = schema.properties;
  const pool = db
    .select()
    .from(P)
    .where(and(eq(P.operation, i.operation), eq(P.type, i.type), inArray(P.status, ["disponible", "reservado", "vendido", "alquilado"]), i.excludeId ? ne(P.id, i.excludeId) : undefined))
    .all()
    .filter((p) => p.areaBuilt && p.areaBuilt > 0 && Math.abs(p.areaBuilt - i.area) / i.area <= 0.35);
  const z = normalize(i.zone),
    c = normalize(i.city);
  let comps = z ? pool.filter((p) => normalize(p.zone) === z) : [];
  let scope = "zona";
  if (comps.length < 3 && c) {
    comps = pool.filter((p) => normalize(p.city) === c);
    scope = "población";
  }
  if (comps.length < 3) {
    comps = pool;
    scope = "general";
  }
  comps = comps.slice(0, 15);
  if (!comps.length) return null;
  const ppm = comps.map((p) => (p.closedPrice ?? p.price) / p.areaBuilt!);
  const f = COND[i.condition] ?? 1;
  const med = q(ppm, 0.5) * f;
  const round = (v: number) => (i.operation === "alquiler" ? Math.round(v / 10) * 10 : Math.round(v / 1000) * 1000);
  return {
    scope,
    pricePerM2: Math.round(med * 100) / 100,
    low: round(q(ppm, 0.25) * f * i.area),
    estimated: round(med * i.area),
    high: round(q(ppm, 0.75) * f * i.area),
    comparables: comps.map((p, k) => ({ id: p.id, ref: p.ref, title: p.title, zone: p.zone, city: p.city, area: p.areaBuilt!, price: p.closedPrice ?? p.price, ppm: Math.round(ppm[k]!), status: p.status })),
  };
}
