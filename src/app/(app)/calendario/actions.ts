"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser, assertCanEdit } from "@/lib/auth/guards";
import { fail, parse, zs, type ActionState } from "@/lib/actions";
import { fromInputDateTime, fromInputDate } from "@/lib/format";

const EventSchema = z.object({
  id: zs.id,
  kind: z.enum(["llamada", "reunion", "visita", "firma", "tarea"]),
  title: zs.req("El título es obligatorio"),
  startsAt: zs.req("Indica la fecha y hora de inicio"),
  endsAt: zs.str,
  allDay: zs.bool,
  location: zs.str,
  details: zs.str,
  clientId: zs.id,
  propertyId: zs.id,
  agentId: zs.id,
  reminderMinutes: z.coerce.number().int().min(0).optional(),
  notifyAll: zs.bool,
  done: zs.bool,
});

export async function saveEvent(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const p = parse(EventSchema, fd);
    if ("state" in p) return p.state;
    const d = p.data;
    const start = d.allDay ? fromInputDate(d.startsAt.slice(0, 10)) : fromInputDateTime(d.startsAt);
    if (!start || isNaN(start.getTime())) return { ok: false, error: "Fecha de inicio no válida", fieldErrors: { startsAt: ["Fecha no válida"] } };
    let end = d.endsAt ? fromInputDateTime(d.endsAt) : null;
    if (end && end < start) return { ok: false, error: "La hora de fin es anterior al inicio", fieldErrors: { endsAt: ["Debe ser posterior al inicio"] } };
    if (!end && !d.allDay) end = new Date(start.getTime() + 60 * 60000);
    const values = {
      kind: d.kind,
      title: d.title,
      startsAt: start,
      endsAt: end,
      allDay: d.allDay,
      location: d.location ?? null,
      details: d.details ?? null,
      clientId: d.clientId ?? null,
      propertyId: d.propertyId ?? null,
      agentId: u.role === "admin" ? (d.agentId ?? u.id) : u.id,
      reminderMinutes: d.reminderMinutes ?? null,
      notifyAll: d.notifyAll,
      done: d.done,
    };
    if (d.id) {
      assertCanEdit(u, db.select().from(schema.events).where(eq(schema.events.id, d.id)).get());
      db.update(schema.events).set(values).where(eq(schema.events.id, d.id)).run();
    } else db.insert(schema.events).values(values).run();
    revalidatePath("/", "layout");
    return { ok: true, message: "Evento guardado" };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteEvent(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const id = Number(fd.get("id"));
    assertCanEdit(u, db.select().from(schema.events).where(eq(schema.events.id, id)).get());
    db.delete(schema.events).where(eq(schema.events.id, id)).run();
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleEventDone(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const id = Number(fd.get("id"));
    const ev = db.select().from(schema.events).where(eq(schema.events.id, id)).get();
    assertCanEdit(u, ev);
    db.update(schema.events).set({ done: !ev!.done }).where(eq(schema.events.id, id)).run();
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Drag & drop reschedule: keep duration, move to new day (and hour in week/day view). */
export async function moveEvent(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const id = Number(fd.get("id"));
    const ev = db.select().from(schema.events).where(eq(schema.events.id, id)).get();
    assertCanEdit(u, ev);
    const to = fromInputDateTime(String(fd.get("to")));
    if (!to) return { ok: false, error: "Fecha no válida" };
    const dur = ev!.endsAt ? ev!.endsAt.getTime() - ev!.startsAt.getTime() : 3600000;
    db.update(schema.events).set({ startsAt: to, endsAt: new Date(to.getTime() + dur) }).where(eq(schema.events.id, id)).run();
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
