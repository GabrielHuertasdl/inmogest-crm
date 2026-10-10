"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser, assertCanEdit, ActionError } from "@/lib/auth/guards";
import { fail, parse, zs, type ActionState } from "@/lib/actions";

const STAGES = ["nuevo", "contactado", "valoracion", "negociacion", "captado", "perdido"] as const;

const LeadSchema = z.object({
  id: zs.id,
  ownerName: zs.req("El nombre del propietario es obligatorio"),
  phone: zs.str,
  email: zs.email,
  address: zs.str,
  city: zs.str,
  zone: zs.str,
  type: zs.str,
  operation: zs.str,
  expectedPrice: zs.int,
  stage: z.enum(STAGES).default("nuevo"),
  agentId: zs.id,
  notes: zs.str,
});

export async function saveLead(_: ActionState, fd: FormData): Promise<ActionState> {
  let id: number;
  try {
    const u = await requireUser();
    const p = parse(LeadSchema, fd);
    if ("state" in p) return p.state;
    const d = p.data;
    const prev = d.id ? db.select().from(schema.leads).where(eq(schema.leads.id, d.id)).get() : undefined;
    if (d.id) assertCanEdit(u, prev);
    const values = {
      ownerName: d.ownerName,
      phone: d.phone ?? null,
      email: d.email ?? null,
      address: d.address ?? null,
      city: d.city ?? null,
      zone: d.zone ?? null,
      type: d.type ?? null,
      operation: d.operation ?? null,
      expectedPrice: d.expectedPrice ?? null,
      stage: d.stage,
      agentId: u.role === "admin" ? (d.agentId ?? u.id) : (prev?.agentId ?? u.id),
      notes: d.notes ?? null,
      capturedAt: d.stage === "captado" ? (prev?.capturedAt ?? new Date()) : null,
    };
    if (d.id) {
      db.update(schema.leads).set(values).where(eq(schema.leads.id, d.id)).run();
      id = d.id;
    } else id = db.insert(schema.leads).values(values).returning({ id: schema.leads.id }).get().id;
    revalidatePath("/", "layout");
  } catch (e) {
    return fail(e);
  }
  redirect(`/captaciones/${id}`);
}

export async function moveLead(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const id = Number(fd.get("id"));
    const stage = String(fd.get("stage"));
    if (!(STAGES as readonly string[]).includes(stage)) throw new ActionError("Etapa no válida");
    const prev = db.select().from(schema.leads).where(eq(schema.leads.id, id)).get();
    assertCanEdit(u, prev);
    db.update(schema.leads)
      .set({ stage, capturedAt: stage === "captado" ? (prev!.capturedAt ?? new Date()) : null })
      .where(eq(schema.leads.id, id))
      .run();
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteLead(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const id = Number(fd.get("id"));
    assertCanEdit(u, db.select().from(schema.leads).where(eq(schema.leads.id, id)).get());
    db.delete(schema.leads).where(eq(schema.leads.id, id)).run();
    revalidatePath("/", "layout");
  } catch (e) {
    return fail(e);
  }
  redirect("/captaciones");
}
