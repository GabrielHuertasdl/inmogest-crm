"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser, assertCanEdit } from "@/lib/auth/guards";
import { fail, parse, zs, type ActionState } from "@/lib/actions";
import { fromInputDateTime } from "@/lib/format";

const TaskSchema = z.object({
  id: zs.id,
  title: zs.req("El título es obligatorio"),
  description: zs.str,
  dueAt: zs.str,
  priority: z.enum(["baja", "media", "alta"]).default("media"),
  agentId: zs.id,
  clientId: zs.id,
  propertyId: zs.id,
});

export async function saveTask(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const p = parse(TaskSchema, fd);
    if ("state" in p) return p.state;
    const d = p.data;
    const values = {
      title: d.title,
      description: d.description ?? null,
      dueAt: fromInputDateTime(d.dueAt),
      priority: d.priority,
      agentId: u.role === "admin" ? (d.agentId ?? u.id) : u.id,
      clientId: d.clientId ?? null,
      propertyId: d.propertyId ?? null,
    };
    if (d.id) {
      assertCanEdit(u, db.select().from(schema.tasks).where(eq(schema.tasks.id, d.id)).get());
      db.update(schema.tasks).set(values).where(eq(schema.tasks.id, d.id)).run();
    } else db.insert(schema.tasks).values(values).run();
    revalidatePath("/", "layout");
    return { ok: true, message: "Tarea guardada" };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleTask(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const id = Number(fd.get("id"));
    const t = db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).get();
    assertCanEdit(u, t);
    db.update(schema.tasks).set({ done: !t!.done, doneAt: t!.done ? null : new Date() }).where(eq(schema.tasks.id, id)).run();
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTask(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const id = Number(fd.get("id"));
    assertCanEdit(u, db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).get());
    db.delete(schema.tasks).where(eq(schema.tasks.id, id)).run();
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
