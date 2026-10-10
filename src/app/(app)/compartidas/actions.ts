"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser, ActionError } from "@/lib/auth/guards";
import { fail, type ActionState } from "@/lib/actions";

/** Opens an internal conversation with the listing agent. */
export async function requestCollaboration(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const p = db.select().from(schema.properties).where(eq(schema.properties.id, Number(fd.get("id")))).get();
    if (!p || !p.isShared) throw new ActionError("La propiedad no está compartida");
    const now = new Date();
    const conv = db
      .insert(schema.conversations)
      .values({ subject: `Solicitud de colaboración · ${p.ref}`, channel: "interno", propertyId: p.id, agentId: p.agentId, lastMessageAt: now })
      .returning()
      .get();
    db.insert(schema.messages)
      .values({ conversationId: conv.id, direction: "entrante", authorUserId: u.id, senderName: u.name, senderEmail: u.email, body: `Hola, me gustaría colaborar en la venta de ${p.ref} (${p.title}) con el reparto de honorarios del ${p.sharedCommissionPct ?? 50}%. Tengo clientes interesados.`, createdAt: now })
      .run();
    revalidatePath("/", "layout");
    return { ok: true, message: "Solicitud enviada al agente" };
  } catch (e) {
    return fail(e);
  }
}
