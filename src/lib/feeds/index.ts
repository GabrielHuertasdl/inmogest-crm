import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { parseJsonArray } from "@/lib/format";
import { FEATURES, PROPERTY_TYPES } from "@/lib/constants";

const x = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // strip XML-illegal control chars
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
const tag = (name: string, v: unknown) => (v == null || v === "" ? "" : `<${name}>${x(v)}</${name}>`);

export function feedProperties(portalId: number) {
  const rows = db
    .select({ p: schema.properties })
    .from(schema.properties)
    .innerJoin(schema.propertyPortals, eq(schema.propertyPortals.propertyId, schema.properties.id))
    .where(and(eq(schema.propertyPortals.portalId, portalId), inArray(schema.properties.status, ["disponible", "reservado"])))
    .orderBy(asc(schema.properties.id))
    .all()
    .map((r) => r.p);
  const ids = rows.map((r) => r.id);
  const photos = ids.length ? db.select().from(schema.propertyPhotos).where(inArray(schema.propertyPhotos.propertyId, ids)).orderBy(asc(schema.propertyPhotos.position)).all() : [];
  return rows.map((p) => ({ ...p, photos: photos.filter((ph) => ph.propertyId === p.id).sort((a, b) => Number(b.isCover) - Number(a.isCover)) }));
}

const KYERO_TYPE: Record<string, string> = { piso: "apartment", atico: "penthouse", duplex: "duplex", estudio: "studio", casa: "town house", chalet: "villa", local: "commercial", oficina: "office", nave: "warehouse", terreno: "land", garaje: "garage" };

/** Kyero feed v3 (also accepted by ThinkSpain and many international portals). */
export function kyeroFeed(base: string, agencyName: string, portalId: number) {
  const items = feedProperties(portalId);
  const out = [`<?xml version="1.0" encoding="UTF-8"?>`, `<root>`, `<kyero><feed_version>3</feed_version></kyero>`, `<agent><name>${x(agencyName)}</name></agent>`];
  for (const p of items) {
    const feats = parseJsonArray(p.features);
    out.push(
      "<property>",
      tag("id", p.ref),
      tag("date", (p.updatedAt ?? p.createdAt).toISOString().slice(0, 19).replace("T", " ")),
      tag("ref", p.ref),
      tag("price", p.price),
      tag("currency", "EUR"),
      tag("price_freq", p.operation === "alquiler" ? "month" : "sale"),
      tag("new_build", p.condition === "nuevo" ? 1 : 0),
      tag("type", KYERO_TYPE[p.type] ?? p.type),
      tag("town", p.city),
      tag("province", p.province),
      p.lat != null && p.lng != null ? `<location>${tag("latitude", p.lat.toFixed(6))}${tag("longitude", p.lng.toFixed(6))}</location>` : "",
      tag("location_detail", p.zone),
      tag("beds", p.rooms),
      tag("baths", p.baths),
      tag("pool", feats.includes("piscina") ? 1 : 0),
      `<surface_area>${tag("built", p.areaBuilt)}${tag("plot", p.plotArea)}</surface_area>`,
      p.energyRating && /^[A-G]$/.test(p.energyRating) ? `<energy_rating>${tag("consumption", p.energyRating)}</energy_rating>` : "",
      `<url>${tag("es", `${base}/web/propiedades/${p.ref}`)}</url>`,
      `<desc>${tag("es", p.description)}${tag("en", p.descriptionEn)}</desc>`,
      feats.length ? `<features>${feats.map((f) => tag("feature", FEATURES[f] ?? f)).join("")}</features>` : "",
      p.photos.length ? `<images>${p.photos.map((ph, i) => `<image id="${i + 1}">${tag("url", `${base}/files/${ph.path}`)}</image>`).join("")}</images>` : "",
      "</property>",
    );
  }
  out.push("</root>");
  return { xml: out.filter(Boolean).join("\n"), count: items.length };
}

/** Generic, self-describing XML (Spanish field names) for portal integrations that accept a custom mapping. */
export function genericFeed(base: string, agency: { name: string; email: string | null; phone: string | null }, portalId: number) {
  const items = feedProperties(portalId);
  const out = [`<?xml version="1.0" encoding="UTF-8"?>`, `<inmuebles generado="${new Date().toISOString()}" total="${items.length}">`, `<agencia>${tag("nombre", agency.name)}${tag("email", agency.email)}${tag("telefono", agency.phone)}</agencia>`];
  for (const p of items) {
    out.push(
      `<inmueble referencia="${x(p.ref)}">`,
      tag("titulo", p.title),
      tag("operacion", p.operation),
      tag("tipo", PROPERTY_TYPES[p.type] ?? p.type),
      tag("estado", p.status),
      tag("precio", p.price),
      tag("gastos_comunidad", p.communityFee),
      tag("superficie_construida", p.areaBuilt),
      tag("superficie_util", p.areaUseful),
      tag("superficie_parcela", p.plotArea),
      tag("habitaciones", p.rooms),
      tag("banos", p.baths),
      tag("planta", p.floor),
      tag("ano_construccion", p.yearBuilt),
      tag("certificado_energetico", p.energyRating),
      tag("conservacion", p.condition),
      `<ubicacion>${tag("direccion", p.showExactLocation ? p.address : null)}${tag("zona", p.zone)}${tag("poblacion", p.city)}${tag("provincia", p.province)}${tag("codigo_postal", p.postalCode)}${p.lat != null ? tag("latitud", p.lat.toFixed(6)) : ""}${p.lng != null ? tag("longitud", p.lng.toFixed(6)) : ""}${tag("ubicacion_exacta", p.showExactLocation ? 1 : 0)}</ubicacion>`,
      `<extras>${parseJsonArray(p.features).map((f) => `<extra codigo="${x(f)}">${x(FEATURES[f] ?? f)}</extra>`).join("")}</extras>`,
      tag("descripcion", p.description),
      tag("descripcion_en", p.descriptionEn),
      tag("url", `${base}/web/propiedades/${p.ref}`),
      `<fotos>${p.photos.map((ph) => `<foto principal="${ph.isCover ? 1 : 0}">${x(`${base}/files/${ph.path}`)}</foto>`).join("")}</fotos>`,
      "</inmueble>",
    );
  }
  out.push("</inmuebles>");
  return { xml: out.join("\n"), count: items.length };
}
