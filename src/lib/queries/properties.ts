import "server-only";
import { and, asc, count, desc, eq, gte, inArray, like, lte, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { parseJsonArray } from "@/lib/format";

export type PropFilters = {
  q?: string;
  operation?: string;
  type?: string;
  status?: string;
  city?: string;
  zone?: string;
  minPrice?: string;
  maxPrice?: string;
  rooms?: string;
  baths?: string;
  minArea?: string;
  agent?: string;
  shared?: string;
  portal?: string;
  feature?: string;
  sort?: string;
  page?: string;
};

export function propertyWhere(f: PropFilters) {
  const w: (SQL | undefined)[] = [];
  const P = schema.properties;
  if (f.q) {
    const p = `%${f.q}%`;
    w.push(or(like(P.ref, p), like(P.title, p), like(P.address, p), like(P.city, p), like(P.zone, p), like(P.description, p)));
  }
  if (f.operation) w.push(eq(P.operation, f.operation));
  if (f.type) w.push(eq(P.type, f.type));
  if (f.status === "cerradas") w.push(inArray(P.status, ["vendido", "alquilado"]));
  else if (f.status === "activas") w.push(inArray(P.status, ["disponible", "reservado"]));
  else if (f.status) w.push(eq(P.status, f.status));
  if (f.city) w.push(eq(P.city, f.city));
  if (f.zone) w.push(eq(P.zone, f.zone));
  if (f.minPrice) w.push(gte(P.price, Number(f.minPrice)));
  if (f.maxPrice) w.push(lte(P.price, Number(f.maxPrice)));
  if (f.rooms) w.push(gte(P.rooms, Number(f.rooms)));
  if (f.baths) w.push(gte(P.baths, Number(f.baths)));
  if (f.minArea) w.push(gte(P.areaBuilt, Number(f.minArea)));
  if (f.agent) w.push(eq(P.agentId, Number(f.agent)));
  if (f.shared === "1") w.push(eq(P.isShared, true));
  if (f.feature) w.push(like(P.features, `%"${f.feature}"%`));
  if (f.portal) w.push(sql`exists (select 1 from property_portals pp join portals po on po.id = pp.portal_id where pp.property_id = ${P.id} and po.key = ${f.portal})`);
  return and(...w);
}

const SORTS: Record<string, SQL> = {
  recientes: desc(schema.properties.createdAt) as unknown as SQL,
  antiguos: asc(schema.properties.createdAt) as unknown as SQL,
  precio_asc: asc(schema.properties.price) as unknown as SQL,
  precio_desc: desc(schema.properties.price) as unknown as SQL,
  ref: asc(schema.properties.ref) as unknown as SQL,
};

export function listProperties(f: PropFilters, pageSize = 20) {
  const where = propertyWhere(f);
  const total = db.select({ n: count() }).from(schema.properties).where(where).get()?.n ?? 0;
  const page = Math.max(1, Number(f.page) || 1);
  const rows = db
    .select({ p: schema.properties, agentName: schema.users.name, agentColor: schema.users.color })
    .from(schema.properties)
    .leftJoin(schema.users, eq(schema.users.id, schema.properties.agentId))
    .where(where)
    .orderBy(SORTS[f.sort ?? "recientes"] ?? SORTS.recientes!)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all();
  const covers = coversFor(rows.map((r) => r.p.id));
  return { rows: rows.map((r) => ({ ...r.p, agentName: r.agentName, agentColor: r.agentColor, cover: covers[r.p.id] ?? null })), total, page, pages: Math.ceil(total / pageSize) };
}

export function coversFor(ids: number[]) {
  if (!ids.length) return {} as Record<number, string>;
  const ph = db.select().from(schema.propertyPhotos).where(inArray(schema.propertyPhotos.propertyId, ids)).orderBy(desc(schema.propertyPhotos.isCover), asc(schema.propertyPhotos.position)).all();
  const out: Record<number, string> = {};
  for (const p of ph) if (!(p.propertyId in out)) out[p.propertyId] = p.path;
  return out;
}

export function propertySummary() {
  const P = schema.properties;
  const all = db.select({ status: P.status, price: P.price, operation: P.operation, closedAt: P.closedAt }).from(P).all();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const active = all.filter((p) => p.status === "disponible" || p.status === "reservado");
  const sale = active.filter((p) => p.operation === "venta");
  const rent = active.filter((p) => p.operation === "alquiler");
  return {
    total: all.length,
    disponibles: all.filter((p) => p.status === "disponible").length,
    reservadas: all.filter((p) => p.status === "reservado").length,
    cerradasMes: all.filter((p) => (p.status === "vendido" || p.status === "alquilado") && p.closedAt && p.closedAt >= monthStart).length,
    mediaVenta: sale.length ? Math.round(sale.reduce((s, p) => s + p.price, 0) / sale.length) : 0,
    mediaAlquiler: rent.length ? Math.round(rent.reduce((s, p) => s + p.price, 0) / rent.length) : 0,
  };
}

export function getProperty(id: number) {
  const row = db
    .select({ p: schema.properties, agent: schema.users })
    .from(schema.properties)
    .leftJoin(schema.users, eq(schema.users.id, schema.properties.agentId))
    .where(eq(schema.properties.id, id))
    .get();
  if (!row) return null;
  const photos = db.select().from(schema.propertyPhotos).where(eq(schema.propertyPhotos.propertyId, id)).orderBy(desc(schema.propertyPhotos.isCover), asc(schema.propertyPhotos.position)).all();
  const portals = db.select({ portalId: schema.propertyPortals.portalId }).from(schema.propertyPortals).where(eq(schema.propertyPortals.propertyId, id)).all().map((r) => r.portalId);
  const owner = row.p.ownerClientId ? db.select().from(schema.clients).where(eq(schema.clients.id, row.p.ownerClientId)).get() : null;
  return { ...row.p, agent: row.agent, photos, portalIds: portals, owner, featureList: parseJsonArray(row.p.features) };
}

export function distinctCities() {
  return db.selectDistinct({ city: schema.properties.city }).from(schema.properties).orderBy(asc(schema.properties.city)).all().map((r) => r.city).filter(Boolean) as string[];
}
export function distinctZones() {
  return db.selectDistinct({ zone: schema.properties.zone, city: schema.properties.city }).from(schema.properties).orderBy(asc(schema.properties.zone)).all().filter((r) => r.zone) as { zone: string; city: string }[];
}

export function nextRef() {
  const last = db.select({ ref: schema.properties.ref }).from(schema.properties).where(like(schema.properties.ref, "IG-%")).orderBy(desc(schema.properties.ref)).limit(1).get();
  const n = last ? Number(last.ref.slice(3)) + 1 : 1;
  return `IG-${String(n).padStart(4, "0")}`;
}

export function clientOptions() {
  return db
    .select({ id: schema.clients.id, name: schema.clients.name, surname: schema.clients.surname, phone: schema.clients.phone, kind: schema.clients.kind })
    .from(schema.clients)
    .orderBy(asc(schema.clients.name))
    .all()
    .map((c) => ({ id: c.id, label: `${c.name} ${c.surname ?? ""}`.trim() + (c.phone ? ` · ${c.phone}` : ""), kind: c.kind }));
}
export function propertyOptions() {
  return db
    .select({ id: schema.properties.id, ref: schema.properties.ref, title: schema.properties.title })
    .from(schema.properties)
    .orderBy(desc(schema.properties.id))
    .all()
    .map((p) => ({ id: p.id, label: `${p.ref} · ${p.title}` }));
}
export function agentOptions(activeOnly = true) {
  return db
    .select({ id: schema.users.id, name: schema.users.name, active: schema.users.active })
    .from(schema.users)
    .orderBy(asc(schema.users.name))
    .all()
    .filter((u) => !activeOnly || u.active)
    .map((u) => ({ value: u.id, label: u.name }));
}
export function allPortals() {
  return db.select().from(schema.portals).orderBy(asc(schema.portals.id)).all();
}
