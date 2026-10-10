import "server-only";
import { and, asc, count, desc, eq, gte, inArray, lte, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { coversFor } from "./properties";
import { parseJsonArray } from "@/lib/format";

const P = schema.properties;
const visible = and(eq(P.publishedWeb, true), inArray(P.status, ["disponible", "reservado"]));

export type PublicFilters = { operation?: string; type?: string; city?: string; minPrice?: string; maxPrice?: string; rooms?: string; sort?: string; page?: string };

/** Public coordinates: exact if allowed, else deterministically offset ~250 m so the real address is not revealed. */
function publicCoords(p: { id: number; lat: number | null; lng: number | null; showExactLocation: boolean }) {
  if (p.lat == null || p.lng == null) return { lat: null, lng: null };
  if (p.showExactLocation) return { lat: p.lat, lng: p.lng };
  const a = ((p.id * 2654435761) % 360) * (Math.PI / 180);
  return { lat: Math.round((p.lat + Math.sin(a) * 0.0022) * 1e5) / 1e5, lng: Math.round((p.lng + Math.cos(a) * 0.0028) * 1e5) / 1e5 };
}

export function toPublic(p: typeof P.$inferSelect, cover: string | null) {
  const c = publicCoords(p);
  return {
    id: p.id,
    ref: p.ref,
    title: p.title,
    operation: p.operation,
    type: p.type,
    status: p.status,
    price: p.price,
    areaBuilt: p.areaBuilt,
    rooms: p.rooms,
    baths: p.baths,
    city: p.city,
    zone: p.zone,
    cover,
    featured: p.featured,
    lat: c.lat,
    lng: c.lng,
  };
}
export type PublicProperty = ReturnType<typeof toPublic>;

export function publicList(f: PublicFilters, pageSize = 12) {
  const w: (SQL | undefined)[] = [visible];
  if (f.operation) w.push(eq(P.operation, f.operation));
  if (f.type) w.push(eq(P.type, f.type));
  if (f.city) w.push(eq(P.city, f.city));
  if (f.minPrice) w.push(gte(P.price, Number(f.minPrice)));
  if (f.maxPrice) w.push(lte(P.price, Number(f.maxPrice)));
  if (f.rooms) w.push(gte(P.rooms, Number(f.rooms)));
  const where = and(...w);
  const total = db.select({ n: count() }).from(P).where(where).get()?.n ?? 0;
  const page = Math.max(1, Number(f.page) || 1);
  const order = f.sort === "precio_asc" ? asc(P.price) : f.sort === "precio_desc" ? desc(P.price) : desc(P.createdAt);
  const rows = db.select().from(P).where(where).orderBy(order).limit(pageSize).offset((page - 1) * pageSize).all();
  const covers = coversFor(rows.map((r) => r.id));
  return { rows: rows.map((r) => toPublic(r, covers[r.id] ?? null)), total, page, pages: Math.ceil(total / pageSize) };
}

export function publicAll() {
  const rows = db.select().from(P).where(visible).all();
  const covers = coversFor(rows.map((r) => r.id));
  return rows.map((r) => toPublic(r, covers[r.id] ?? null));
}

export function publicHome() {
  const latest = db.select().from(P).where(visible).orderBy(desc(P.createdAt)).limit(8).all();
  const cheapest = db.select().from(P).where(and(visible, eq(P.operation, "venta"))).orderBy(asc(P.price)).limit(4).all();
  const featured = db.select().from(P).where(and(visible, eq(P.featured, true))).orderBy(desc(P.updatedAt)).limit(4).all();
  const covers = coversFor([...latest, ...cheapest, ...featured].map((r) => r.id));
  const m = (r: typeof latest) => r.map((p) => toPublic(p, covers[p.id] ?? null));
  return { latest: m(latest), cheapest: m(cheapest), featured: m(featured) };
}

export function publicByRef(ref: string) {
  const p = db.select().from(P).where(and(visible, eq(P.ref, ref))).get();
  if (!p) return null;
  const photos = db.select().from(schema.propertyPhotos).where(eq(schema.propertyPhotos.propertyId, p.id)).orderBy(desc(schema.propertyPhotos.isCover), asc(schema.propertyPhotos.position)).all();
  const agent = p.agentId ? db.select({ name: schema.users.name, phone: schema.users.phone, email: schema.users.email, color: schema.users.color, avatarPath: schema.users.avatarPath }).from(schema.users).where(eq(schema.users.id, p.agentId)).get() : null;
  return {
    ...toPublic(p, photos[0]?.path ?? null),
    address: p.showExactLocation ? p.address : null,
    showExactLocation: p.showExactLocation,
    description: p.description,
    descriptionEn: p.descriptionEn,
    areaUseful: p.areaUseful,
    plotArea: p.plotArea,
    floor: p.floor,
    yearBuilt: p.yearBuilt,
    energyRating: p.energyRating,
    condition: p.condition,
    communityFee: p.communityFee,
    features: parseJsonArray(p.features),
    photos: photos.map((ph) => ph.path),
    agent,
  };
}

export function publicCities() {
  return db.selectDistinct({ city: P.city }).from(P).where(visible).orderBy(asc(P.city)).all().map((r) => r.city).filter(Boolean) as string[];
}

export function publicAgency() {
  return db.select().from(schema.agency).get()!;
}
export function publicAgents() {
  return db.select({ id: schema.users.id, name: schema.users.name, phone: schema.users.phone, email: schema.users.email, color: schema.users.color, avatarPath: schema.users.avatarPath }).from(schema.users).where(eq(schema.users.active, true)).orderBy(asc(schema.users.name)).all();
}
