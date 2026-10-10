"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser, assertCanEdit, ActionError } from "@/lib/auth/guards";
import { fail, parse, zs, type ActionState } from "@/lib/actions";
import { nextRef } from "@/lib/queries/properties";
import { saveImage, removeUpload } from "@/lib/uploads";

const PropertySchema = z.object({
  id: zs.id,
  title: zs.req("El título es obligatorio"),
  operation: z.enum(["venta", "alquiler", "traspaso"]),
  type: z.string().min(1),
  status: z.enum(["disponible", "reservado", "vendido", "alquilado", "retirado", "borrador"]).default("disponible"),
  price: z.coerce.number({ error: "Precio obligatorio" }).int().min(0, "Precio no válido"),
  communityFee: zs.int,
  areaBuilt: zs.int,
  areaUseful: zs.int,
  plotArea: zs.int,
  rooms: zs.int,
  baths: zs.int,
  floor: zs.str,
  yearBuilt: z.coerce.number().int().min(1700).max(2100).optional(),
  energyRating: zs.str,
  condition: z.enum(["nuevo", "buen_estado", "a_reformar"]).default("buen_estado"),
  address: zs.str,
  city: zs.str,
  zone: zs.str,
  province: zs.str,
  postalCode: zs.str,
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  showExactLocation: zs.bool,
  description: zs.str,
  descriptionEn: zs.str,
  features: zs.arr,
  portals: zs.arr,
  agentId: zs.id,
  ownerClientId: zs.id,
  isShared: zs.bool,
  sharedCommissionPct: z.coerce.number().min(0).max(100).optional(),
  commissionPct: z.coerce.number().min(0).max(100).default(3),
  featured: zs.bool,
  publishedWeb: zs.bool,
  closedPrice: zs.int,
  leadId: zs.id,
});

export async function saveProperty(_: ActionState, fd: FormData): Promise<ActionState> {
  let id: number;
  try {
    const u = await requireUser();
    const p = parse(PropertySchema, fd);
    if ("state" in p) return p.state;
    const d = p.data;
    const prev = d.id ? db.select().from(schema.properties).where(eq(schema.properties.id, d.id)).get() : undefined;
    if (d.id) assertCanEdit(u, prev);
    const closing = (d.status === "vendido" || d.status === "alquilado") && (!prev || prev.status !== d.status);
    const values = {
      title: d.title,
      operation: d.operation,
      type: d.type,
      status: d.status,
      price: d.price,
      communityFee: d.communityFee ?? null,
      areaBuilt: d.areaBuilt ?? null,
      areaUseful: d.areaUseful ?? null,
      plotArea: d.plotArea ?? null,
      rooms: d.rooms ?? null,
      baths: d.baths ?? null,
      floor: d.floor ?? null,
      yearBuilt: d.yearBuilt ?? null,
      energyRating: d.energyRating ?? null,
      condition: d.condition,
      address: d.address ?? null,
      city: d.city ?? null,
      zone: d.zone ?? null,
      province: d.province ?? null,
      postalCode: d.postalCode ?? null,
      lat: d.lat ?? null,
      lng: d.lng ?? null,
      showExactLocation: d.showExactLocation,
      description: d.description ?? null,
      descriptionEn: d.descriptionEn ?? null,
      features: JSON.stringify(d.features),
      agentId: u.role === "admin" ? (d.agentId ?? u.id) : (prev?.agentId ?? u.id),
      ownerClientId: d.ownerClientId ?? null,
      isShared: d.isShared,
      sharedCommissionPct: d.sharedCommissionPct ?? 50,
      commissionPct: d.commissionPct,
      featured: d.featured,
      publishedWeb: d.publishedWeb,
      closedAt: closing ? new Date() : d.status === "vendido" || d.status === "alquilado" ? (prev?.closedAt ?? new Date()) : null,
      closedPrice: d.status === "vendido" || d.status === "alquilado" ? (d.closedPrice ?? prev?.closedPrice ?? d.price) : null,
      updatedAt: new Date(),
    };
    id = db.transaction((tx) => {
      let pid = d.id;
      if (pid) tx.update(schema.properties).set(values).where(eq(schema.properties.id, pid)).run();
      else pid = tx.insert(schema.properties).values({ ...values, ref: nextRef(), leadId: d.leadId ?? null }).returning({ id: schema.properties.id }).get().id;
      // portals (only enabled ones are toggleable)
      const portalIds = d.portals.map(Number).filter(Boolean);
      tx.delete(schema.propertyPortals).where(eq(schema.propertyPortals.propertyId, pid)).run();
      for (const portalId of portalIds) tx.insert(schema.propertyPortals).values({ propertyId: pid, portalId }).run();
      if (d.leadId && !d.id) tx.update(schema.leads).set({ propertyId: pid, stage: "captado", capturedAt: new Date() }).where(eq(schema.leads.id, d.leadId)).run();
      return pid;
    });
    // photos uploaded with the form
    const files = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length) await addPhotos(id, files);
    revalidatePath("/", "layout");
  } catch (e) {
    return fail(e);
  }
  redirect(`/propiedades/${id}`);
}

async function addPhotos(propertyId: number, files: File[]) {
  const existing = db.select().from(schema.propertyPhotos).where(eq(schema.propertyPhotos.propertyId, propertyId)).all();
  let pos = existing.reduce((m, p) => Math.max(m, p.position + 1), 0);
  const hasCover = existing.some((p) => p.isCover);
  const errors: string[] = [];
  let first = !hasCover;
  for (const f of files) {
    try {
      const rel = await saveImage(f, `properties/${propertyId}`);
      db.insert(schema.propertyPhotos).values({ propertyId, path: rel, position: pos++, isCover: first }).run();
      first = false;
    } catch (e) {
      errors.push((e as Error).message);
    }
  }
  if (errors.length) throw new ActionError(errors.join(". "));
}

export async function uploadPhotos(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const id = Number(fd.get("propertyId"));
    assertCanEdit(u, db.select().from(schema.properties).where(eq(schema.properties.id, id)).get());
    const files = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) return { ok: false, error: "Selecciona al menos una imagen" };
    await addPhotos(id, files);
    revalidatePath(`/propiedades/${id}`);
    return { ok: true, message: `${files.length} foto(s) subida(s)` };
  } catch (e) {
    return fail(e);
  }
}

async function photoGuard(fd: FormData) {
  const u = await requireUser();
  const photo = db.select().from(schema.propertyPhotos).where(eq(schema.propertyPhotos.id, Number(fd.get("photoId")))).get();
  if (!photo) throw new ActionError("Foto no encontrada");
  assertCanEdit(u, db.select().from(schema.properties).where(eq(schema.properties.id, photo.propertyId)).get());
  return photo;
}

export async function setCover(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const ph = await photoGuard(fd);
    db.update(schema.propertyPhotos).set({ isCover: false }).where(eq(schema.propertyPhotos.propertyId, ph.propertyId)).run();
    db.update(schema.propertyPhotos).set({ isCover: true }).where(eq(schema.propertyPhotos.id, ph.id)).run();
    revalidatePath(`/propiedades/${ph.propertyId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function movePhoto(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const ph = await photoGuard(fd);
    const dir = fd.get("dir") === "up" ? -1 : 1;
    const list = db.select().from(schema.propertyPhotos).where(eq(schema.propertyPhotos.propertyId, ph.propertyId)).orderBy(asc(schema.propertyPhotos.position)).all();
    const i = list.findIndex((p) => p.id === ph.id);
    const j = i + dir;
    if (j >= 0 && j < list.length) {
      const order = [...list];
      [order[i], order[j]] = [order[j]!, order[i]!];
      order.forEach((p, k) => db.update(schema.propertyPhotos).set({ position: k }).where(eq(schema.propertyPhotos.id, p.id)).run());
    }
    revalidatePath(`/propiedades/${ph.propertyId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deletePhoto(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const ph = await photoGuard(fd);
    db.delete(schema.propertyPhotos).where(eq(schema.propertyPhotos.id, ph.id)).run();
    removeUpload(ph.path);
    if (ph.isCover) {
      const next = db.select().from(schema.propertyPhotos).where(eq(schema.propertyPhotos.propertyId, ph.propertyId)).orderBy(asc(schema.propertyPhotos.position)).get();
      if (next) db.update(schema.propertyPhotos).set({ isCover: true }).where(eq(schema.propertyPhotos.id, next.id)).run();
    }
    revalidatePath(`/propiedades/${ph.propertyId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function changeStatus(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const id = Number(fd.get("id"));
    const status = String(fd.get("status"));
    if (!["disponible", "reservado", "vendido", "alquilado", "retirado", "borrador"].includes(status)) throw new ActionError("Estado no válido");
    const prev = db.select().from(schema.properties).where(eq(schema.properties.id, id)).get();
    assertCanEdit(u, prev);
    const closed = status === "vendido" || status === "alquilado";
    const closedPrice = Number(fd.get("closedPrice")) || prev!.price;
    db.update(schema.properties)
      .set({ status, closedAt: closed ? (prev!.closedAt && prev!.status === status ? prev!.closedAt : new Date()) : null, closedPrice: closed ? closedPrice : null, updatedAt: new Date() })
      .where(eq(schema.properties.id, id))
      .run();
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProperty(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const id = Number(fd.get("id"));
    const prev = db.select().from(schema.properties).where(eq(schema.properties.id, id)).get();
    assertCanEdit(u, prev);
    const photos = db.select().from(schema.propertyPhotos).where(eq(schema.propertyPhotos.propertyId, id)).all();
    db.delete(schema.properties).where(eq(schema.properties.id, id)).run();
    photos.forEach((p) => removeUpload(p.path));
    revalidatePath("/", "layout");
  } catch (e) {
    return fail(e);
  }
  redirect("/propiedades");
}

export async function duplicateProperty(_: ActionState, fd: FormData): Promise<ActionState> {
  let newId: number;
  try {
    const u = await requireUser();
    const src = db.select().from(schema.properties).where(eq(schema.properties.id, Number(fd.get("id")))).get();
    if (!src) throw new ActionError("Propiedad no encontrada");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ref, createdAt, closedAt, closedPrice, ...rest } = src;
    newId = db
      .insert(schema.properties)
      .values({ ...rest, ref: nextRef(), title: `${src.title} (copia)`, status: "borrador", agentId: u.role === "admin" ? src.agentId : u.id, updatedAt: new Date() })
      .returning({ id: schema.properties.id })
      .get().id;
    revalidatePath("/propiedades");
  } catch (e) {
    return fail(e);
  }
  redirect(`/propiedades/${newId}/editar`);
}

export async function togglePortal(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const propertyId = Number(fd.get("propertyId"));
    const portalId = Number(fd.get("portalId"));
    assertCanEdit(u, db.select().from(schema.properties).where(eq(schema.properties.id, propertyId)).get());
    const on = db.select().from(schema.propertyPortals).where(and(eq(schema.propertyPortals.propertyId, propertyId), eq(schema.propertyPortals.portalId, portalId))).get();
    if (on) db.delete(schema.propertyPortals).where(and(eq(schema.propertyPortals.propertyId, propertyId), eq(schema.propertyPortals.portalId, portalId))).run();
    else db.insert(schema.propertyPortals).values({ propertyId, portalId }).run();
    revalidatePath("/portales");
    revalidatePath(`/propiedades/${propertyId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function bulkPortal(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const ids = fd.getAll("ids").map(Number).filter(Boolean);
    const portalId = Number(fd.get("portalId"));
    const mode = fd.get("mode") === "off" ? "off" : "on";
    const props = db.select().from(schema.properties).where(inArray(schema.properties.id, ids)).all();
    props.forEach((p) => assertCanEdit(u, p));
    const portals = portalId ? [portalId] : db.select({ id: schema.portals.id }).from(schema.portals).where(eq(schema.portals.enabled, true)).all().map((p) => p.id);
    for (const pid of ids)
      for (const po of portals) {
        if (mode === "on") db.insert(schema.propertyPortals).values({ propertyId: pid, portalId: po }).onConflictDoNothing().run();
        else db.delete(schema.propertyPortals).where(and(eq(schema.propertyPortals.propertyId, pid), eq(schema.propertyPortals.portalId, po))).run();
      }
    revalidatePath("/portales");
    return { ok: true, message: "Publicación actualizada" };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleShared(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const id = Number(fd.get("id"));
    const p = db.select().from(schema.properties).where(eq(schema.properties.id, id)).get();
    assertCanEdit(u, p);
    const pct = Number(fd.get("pct"));
    db.update(schema.properties)
      .set({ isShared: fd.has("pct") ? true : !p!.isShared, sharedCommissionPct: pct >= 0 && pct <= 100 && fd.has("pct") ? pct : p!.sharedCommissionPct })
      .where(eq(schema.properties.id, id))
      .run();
    revalidatePath("/compartidas");
    revalidatePath(`/propiedades/${id}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
