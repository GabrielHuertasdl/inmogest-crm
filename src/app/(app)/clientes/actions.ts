"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser, assertCanEdit, ActionError } from "@/lib/auth/guards";
import { fail, parse, zs, type ActionState } from "@/lib/actions";

const ClientSchema = z.object({
  id: zs.id,
  name: zs.req("El nombre es obligatorio"),
  surname: zs.str,
  email: zs.email,
  phone: zs.str,
  phone2: zs.str,
  dni: zs.str,
  address: zs.str,
  kind: z.enum(["comprador", "inquilino", "propietario", "inversor", "otro"]).default("comprador"),
  source: z.enum(["web", "portal", "telefono", "oficina", "referido", "otro"]).default("oficina"),
  status: z.enum(["nuevo", "activo", "en_negociacion", "cerrado", "descartado"]).default("nuevo"),
  agentId: zs.id,
  notes: zs.str,
  gdprConsent: zs.bool,
  // preferences
  prefActive: zs.bool,
  prefOperation: zs.str,
  prefTypes: zs.arr,
  prefMinPrice: zs.int,
  prefMaxPrice: zs.int,
  prefMinRooms: zs.int,
  prefMinBaths: zs.int,
  prefMinArea: zs.int,
  prefZones: zs.str,
  prefFeatures: zs.arr,
  conversationId: zs.id,
});

export async function saveClient(_: ActionState, fd: FormData): Promise<ActionState> {
  let id: number;
  try {
    const u = await requireUser();
    const p = parse(ClientSchema, fd);
    if ("state" in p) return p.state;
    const d = p.data;
    if (!d.email && !d.phone) return { ok: false, error: "Indica al menos un email o un teléfono", fieldErrors: { phone: ["Email o teléfono obligatorio"] } };
    const prev = d.id ? db.select().from(schema.clients).where(eq(schema.clients.id, d.id)).get() : undefined;
    if (d.id) assertCanEdit(u, prev);
    const values = {
      name: d.name,
      surname: d.surname ?? null,
      email: d.email?.toLowerCase() ?? null,
      phone: d.phone ?? null,
      phone2: d.phone2 ?? null,
      dni: d.dni?.toUpperCase() ?? null,
      address: d.address ?? null,
      kind: d.kind,
      source: d.source,
      status: d.status,
      agentId: u.role === "admin" ? (d.agentId ?? u.id) : (prev?.agentId ?? u.id),
      notes: d.notes ?? null,
      gdprConsent: d.gdprConsent,
    };
    id = db.transaction((tx) => {
      let cid = d.id;
      if (cid) tx.update(schema.clients).set(values).where(eq(schema.clients.id, cid)).run();
      else cid = tx.insert(schema.clients).values(values).returning({ id: schema.clients.id }).get().id;
      const zones = (d.prefZones ?? "")
        .split(",")
        .map((z) => z.trim())
        .filter(Boolean);
      const pref = {
        operation: d.prefOperation ?? null,
        types: JSON.stringify(d.prefTypes),
        minPrice: d.prefMinPrice ?? null,
        maxPrice: d.prefMaxPrice ?? null,
        minRooms: d.prefMinRooms ?? null,
        minBaths: d.prefMinBaths ?? null,
        minArea: d.prefMinArea ?? null,
        zones: JSON.stringify(zones),
        features: JSON.stringify(d.prefFeatures),
        active: d.prefActive,
      };
      tx.insert(schema.clientPreferences)
        .values({ clientId: cid, ...pref })
        .onConflictDoUpdate({ target: schema.clientPreferences.clientId, set: pref })
        .run();
      if (d.conversationId) tx.update(schema.conversations).set({ clientId: cid }).where(eq(schema.conversations.id, d.conversationId)).run();
      return cid;
    });
    revalidatePath("/", "layout");
  } catch (e) {
    return fail(e);
  }
  redirect(`/clientes/${id}`);
}

export async function deleteClient(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const id = Number(fd.get("id"));
    assertCanEdit(u, db.select().from(schema.clients).where(eq(schema.clients.id, id)).get());
    db.delete(schema.clients).where(eq(schema.clients.id, id)).run();
    revalidatePath("/", "layout");
  } catch (e) {
    return fail(e);
  }
  redirect("/clientes");
}

export async function markInterest(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await requireUser();
    const clientId = Number(fd.get("clientId"));
    const propertyId = Number(fd.get("propertyId"));
    const status = String(fd.get("status") ?? "");
    if (!clientId || !propertyId) throw new ActionError("Datos incompletos");
    const where = and(eq(schema.clientPropertyInterest.clientId, clientId), eq(schema.clientPropertyInterest.propertyId, propertyId));
    if (!status) db.delete(schema.clientPropertyInterest).where(where).run();
    else {
      if (!["propuesta", "interesado", "visitado", "descartado"].includes(status)) throw new ActionError("Estado no válido");
      db.insert(schema.clientPropertyInterest)
        .values({ clientId, propertyId, status })
        .onConflictDoUpdate({ target: [schema.clientPropertyInterest.clientId, schema.clientPropertyInterest.propertyId], set: { status } })
        .run();
    }
    revalidatePath(`/clientes/${clientId}`);
    revalidatePath(`/propiedades/${propertyId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setClientStatus(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const id = Number(fd.get("id"));
    const status = String(fd.get("status"));
    if (!["nuevo", "activo", "en_negociacion", "cerrado", "descartado"].includes(status)) throw new ActionError("Estado no válido");
    assertCanEdit(u, db.select().from(schema.clients).where(eq(schema.clients.id, id)).get());
    db.update(schema.clients).set({ status }).where(eq(schema.clients.id, id)).run();
    revalidatePath(`/clientes/${id}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
