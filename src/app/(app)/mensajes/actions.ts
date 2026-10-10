"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser, ActionError } from "@/lib/auth/guards";
import { fail, parse, zs, type ActionState } from "@/lib/actions";

export async function sendMessage(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const conversationId = Number(fd.get("conversationId"));
    const body = String(fd.get("body") ?? "").trim();
    const internal = fd.get("internal") === "on";
    if (!body) return { ok: false, error: "Escribe un mensaje" };
    if (body.length > 5000) return { ok: false, error: "Mensaje demasiado largo" };
    const conv = db.select().from(schema.conversations).where(eq(schema.conversations.id, conversationId)).get();
    if (!conv) throw new ActionError("Conversación no encontrada");
    const now = new Date();
    db.insert(schema.messages).values({ conversationId, direction: internal ? "interno" : "saliente", authorUserId: u.id, body, readAt: now, createdAt: now }).run();
    db.update(schema.conversations).set({ lastMessageAt: now, agentId: conv.agentId ?? u.id }).where(eq(schema.conversations.id, conversationId)).run();
    revalidatePath("/mensajes");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function markRead(conversationId: number) {
  await requireUser();
  db.update(schema.messages)
    .set({ readAt: new Date() })
    .where(and(eq(schema.messages.conversationId, conversationId), isNull(schema.messages.readAt)))
    .run();
  revalidatePath("/", "layout");
}

export async function markUnread(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await requireUser();
    const id = Number(fd.get("id"));
    const last = db.select().from(schema.messages).where(and(eq(schema.messages.conversationId, id), eq(schema.messages.direction, "entrante"))).all().at(-1);
    if (last) db.update(schema.messages).set({ readAt: null }).where(eq(schema.messages.id, last.id)).run();
    revalidatePath("/", "layout");
  } catch (e) {
    return fail(e);
  }
  redirect("/mensajes");
}

export async function deleteConversation(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const id = Number(fd.get("id"));
    const conv = db.select().from(schema.conversations).where(eq(schema.conversations.id, id)).get();
    if (!conv) throw new ActionError("Conversación no encontrada");
    if (u.role !== "admin" && conv.agentId && conv.agentId !== u.id) throw new ActionError("No tienes permiso");
    db.delete(schema.conversations).where(eq(schema.conversations.id, id)).run();
    revalidatePath("/", "layout");
  } catch (e) {
    return fail(e);
  }
  redirect("/mensajes");
}

const NewConv = z.object({ subject: zs.req("Indica un asunto"), body: zs.req("Escribe el mensaje"), clientId: zs.id, propertyId: zs.id, channel: z.enum(["interno", "email"]).default("email"), toAgentId: zs.id });

export async function newConversation(_: ActionState, fd: FormData): Promise<ActionState> {
  let id: number;
  try {
    const u = await requireUser();
    const p = parse(NewConv, fd);
    if ("state" in p) return p.state;
    const d = p.data;
    if (d.channel === "email" && !d.clientId) return { ok: false, error: "Selecciona un cliente", fieldErrors: { clientId: ["Obligatorio"] } };
    const now = new Date();
    id = db.transaction((tx) => {
      const conv = tx
        .insert(schema.conversations)
        .values({ subject: d.subject, channel: d.channel, clientId: d.clientId ?? null, propertyId: d.propertyId ?? null, agentId: d.toAgentId ?? u.id, lastMessageAt: now })
        .returning()
        .get();
      tx.insert(schema.messages)
        .values({ conversationId: conv.id, direction: d.channel === "interno" ? "entrante" : "saliente", authorUserId: u.id, body: d.body, senderName: d.channel === "interno" ? u.name : null, readAt: d.channel === "interno" && d.toAgentId && d.toAgentId !== u.id ? null : now, createdAt: now })
        .run();
      return conv.id;
    });
    revalidatePath("/", "layout");
  } catch (e) {
    return fail(e);
  }
  redirect(`/mensajes?c=${id}`);
}
