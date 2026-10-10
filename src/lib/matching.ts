import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { ClientPref, Property } from "@/db/schema";
import { normalize, parseJsonArray } from "@/lib/format";
import { ZONE_ALIASES, FEATURES, PROPERTY_TYPES } from "@/lib/constants";

export type MatchReason = { ok: boolean; text: string };
export type Match = { score: number; reasons: MatchReason[] };

function zoneMatches(zones: string[], p: Pick<Property, "zone" | "city">) {
  if (!zones.length) return null;
  const targets = [normalize(p.zone), normalize(p.city)];
  return zones.some((z) => {
    const n = normalize(z);
    const aliases = [n, ...(ZONE_ALIASES[n] ?? []), ...Object.entries(ZONE_ALIASES).filter(([, v]) => v.includes(n)).map(([k]) => k)];
    return aliases.some((a) => targets.includes(a) || targets.some((t) => t && t.includes(a)));
  });
}

/** Hard filters + soft score (0–100). Returns null when a hard filter fails. */
export function score(pref: ClientPref, p: Property): Match | null {
  const reasons: MatchReason[] = [];
  if (pref.operation && pref.operation !== p.operation) return null;
  if (!["disponible", "reservado"].includes(p.status)) return null;
  const types = parseJsonArray(pref.types);
  if (types.length && !types.includes(p.type)) return null;
  if (pref.maxPrice && p.price > pref.maxPrice * 1.1) return null;
  if (pref.minPrice && p.price < pref.minPrice * 0.9) return null;
  if (pref.minRooms && (p.rooms ?? 0) < pref.minRooms) return null;

  let s = 0;
  // price fit (40)
  if (pref.maxPrice) {
    if (p.price <= pref.maxPrice) {
      s += 40;
      reasons.push({ ok: true, text: "Precio dentro del presupuesto" });
    } else {
      const over = (p.price - pref.maxPrice) / pref.maxPrice;
      s += Math.round(40 * (1 - over / 0.1));
      reasons.push({ ok: false, text: `Precio ${Math.round(over * 100)}% por encima del máximo` });
    }
  } else s += 30;
  // zone (25)
  const zm = zoneMatches(parseJsonArray(pref.zones), p);
  if (zm === null) s += 15;
  else if (zm) {
    s += 25;
    reasons.push({ ok: true, text: `Zona: ${p.zone ?? p.city}` });
  } else reasons.push({ ok: false, text: "Fuera de las zonas preferidas" });
  // rooms & baths (15)
  s += 10;
  if (pref.minRooms) reasons.push({ ok: true, text: `${p.rooms} hab. (mín. ${pref.minRooms})` });
  if (pref.minBaths) {
    if ((p.baths ?? 0) >= pref.minBaths) {
      s += 5;
      reasons.push({ ok: true, text: `${p.baths} baños` });
    } else reasons.push({ ok: false, text: `Menos baños de los deseados (${p.baths ?? 0})` });
  } else s += 5;
  // area (10)
  if (pref.minArea) {
    if ((p.areaBuilt ?? 0) >= pref.minArea) {
      s += 10;
      reasons.push({ ok: true, text: `${p.areaBuilt} m²` });
    } else reasons.push({ ok: false, text: `Superficie menor (${p.areaBuilt ?? 0} m² de ${pref.minArea})` });
  } else s += 10;
  // features (10)
  const want = parseJsonArray(pref.features);
  if (want.length) {
    const has = parseJsonArray(p.features);
    const hit = want.filter((f) => has.includes(f));
    s += Math.round((10 * hit.length) / want.length);
    for (const f of want) reasons.push({ ok: has.includes(f), text: FEATURES[f] ?? f });
  } else s += 10;
  if (types.length) reasons.unshift({ ok: true, text: PROPERTY_TYPES[p.type] ?? p.type });
  return { score: Math.max(0, Math.min(100, s)), reasons };
}

export function matchPropertiesForClient(clientId: number, limit = 50) {
  const pref = db.select().from(schema.clientPreferences).where(eq(schema.clientPreferences.clientId, clientId)).get();
  if (!pref || !pref.active) return { pref: pref ?? null, matches: [] };
  const P = schema.properties;
  const cands = db
    .select()
    .from(P)
    .where(and(inArray(P.status, ["disponible", "reservado"]), pref.operation ? eq(P.operation, pref.operation) : undefined))
    .all();
  const matches = cands
    .map((p) => ({ property: p, m: score(pref, p) }))
    .filter((x): x is { property: Property; m: Match } => !!x.m)
    .sort((a, b) => b.m.score - a.m.score)
    .slice(0, limit);
  return { pref, matches };
}

export function matchClientsForProperty(propertyId: number, limit = 50) {
  const p = db.select().from(schema.properties).where(eq(schema.properties.id, propertyId)).get();
  if (!p) return [];
  const rows = db
    .select({ pref: schema.clientPreferences, client: schema.clients })
    .from(schema.clientPreferences)
    .innerJoin(schema.clients, eq(schema.clients.id, schema.clientPreferences.clientId))
    .where(and(eq(schema.clientPreferences.active, true), inArray(schema.clients.status, ["nuevo", "activo", "en_negociacion"])))
    .all();
  return rows
    .map((r) => ({ client: r.client, m: score(r.pref, p) }))
    .filter((x): x is { client: typeof x.client; m: Match } => !!x.m)
    .sort((a, b) => b.m.score - a.m.score)
    .slice(0, limit);
}

export function interestMap(where: { clientId?: number; propertyId?: number }) {
  const rows = db
    .select()
    .from(schema.clientPropertyInterest)
    .where(where.clientId ? eq(schema.clientPropertyInterest.clientId, where.clientId) : eq(schema.clientPropertyInterest.propertyId, where.propertyId!))
    .all();
  const m: Record<string, string> = {};
  for (const r of rows) m[`${r.clientId}:${r.propertyId}`] = r.status;
  return m;
}
