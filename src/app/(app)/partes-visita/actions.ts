"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser, assertCanEdit } from "@/lib/auth/guards";
import { fail, parse, zs, type ActionState } from "@/lib/actions";
import { fromInputDateTime } from "@/lib/format";

const V = z.object({
  propertyId: z.coerce.number({ error: "Selecciona una propiedad" }).int().positive("Selecciona una propiedad"),
  clientId: z.coerce.number({ error: "Selecciona un cliente" }).int().positive("Selecciona un cliente"),
  eventId: zs.id,
  visitedAt: zs.req("Indica fecha y hora"),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  interestLevel: z.enum(["bajo", "medio", "alto"]).default("medio"),
  offerAmount: zs.int,
  feedback: zs.str,
  clientDni: zs.str,
  signature: z
    .string()
    .max(400_000)
    .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, "Firma no válida")
    .optional(),
});

export async function saveVisitReport(_: ActionState, fd: FormData): Promise<ActionState> {
  let id: number;
  try {
    const u = await requireUser();
    const p = parse(V, fd);
    if ("state" in p) return p.state;
    const d = p.data;
    id = db.transaction((tx) => {
      const rid = tx
        .insert(schema.visitReports)
        .values({
          propertyId: d.propertyId,
          clientId: d.clientId,
          agentId: u.id,
          eventId: d.eventId ?? null,
          visitedAt: fromInputDateTime(d.visitedAt)!,
          rating: d.rating ?? null,
          interestLevel: d.interestLevel,
          offerAmount: d.offerAmount ?? null,
          feedback: d.feedback ?? null,
          clientDni: d.clientDni ?? null,
          signaturePng: d.signature ?? null,
        })
        .returning({ id: schema.visitReports.id })
        .get().id;
      if (d.eventId) tx.update(schema.events).set({ done: true }).where(eq(schema.events.id, d.eventId)).run();
      tx.insert(schema.clientPropertyInterest)
        .values({ clientId: d.clientId, propertyId: d.propertyId, status: d.interestLevel === "bajo" ? "descartado" : "visitado" })
        .onConflictDoUpdate({ target: [schema.clientPropertyInterest.clientId, schema.clientPropertyInterest.propertyId], set: { status: d.interestLevel === "bajo" ? "descartado" : "visitado" } })
        .run();
      return rid;
    });
    revalidatePath("/", "layout");
  } catch (e) {
    return fail(e);
  }
  redirect(`/print/parte-visita/${id}`);
}

export async function deleteVisitReport(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const id = Number(fd.get("id"));
    assertCanEdit(u, db.select().from(schema.visitReports).where(eq(schema.visitReports.id, id)).get());
    db.delete(schema.visitReports).where(eq(schema.visitReports.id, id)).run();
    revalidatePath("/partes-visita");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
