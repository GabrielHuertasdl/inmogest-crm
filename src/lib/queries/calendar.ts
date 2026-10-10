import "server-only";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { dayKey, toInputDateTime } from "@/lib/format";

export type CalEvent = {
  id: number;
  kind: string;
  title: string;
  start: string; // yyyy-MM-ddTHH:mm (Madrid)
  end: string | null;
  day: string;
  allDay: boolean;
  location: string | null;
  details: string | null;
  clientId: number | null;
  clientName: string | null;
  propertyId: number | null;
  propertyRef: string | null;
  agentId: number | null;
  agentName: string | null;
  agentColor: string | null;
  reminderMinutes: number | null;
  notifyAll: boolean;
  done: boolean;
};

export function eventsBetween(from: Date, to: Date, agentId: number | null, kind?: string): CalEvent[] {
  const E = schema.events;
  return db
    .select({ e: E, c: schema.clients, p: schema.properties, a: schema.users })
    .from(E)
    .leftJoin(schema.clients, eq(schema.clients.id, E.clientId))
    .leftJoin(schema.properties, eq(schema.properties.id, E.propertyId))
    .leftJoin(schema.users, eq(schema.users.id, E.agentId))
    .where(and(gte(E.startsAt, from), lt(E.startsAt, to), agentId ? eq(E.agentId, agentId) : undefined, kind ? eq(E.kind, kind) : undefined))
    .orderBy(asc(E.startsAt))
    .all()
    .map(({ e, c, p, a }) => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      start: toInputDateTime(e.startsAt),
      end: e.endsAt ? toInputDateTime(e.endsAt) : null,
      day: dayKey(e.startsAt),
      allDay: e.allDay,
      location: e.location,
      details: e.details,
      clientId: e.clientId,
      clientName: c ? `${c.name} ${c.surname ?? ""}`.trim() : null,
      propertyId: e.propertyId,
      propertyRef: p ? `${p.ref} · ${p.title}` : null,
      agentId: e.agentId,
      agentName: a?.name ?? null,
      agentColor: a?.color ?? null,
      reminderMinutes: e.reminderMinutes,
      notifyAll: e.notifyAll,
      done: e.done,
    }));
}

export function tasksBetween(from: Date, to: Date, agentId: number | null) {
  return db
    .select()
    .from(schema.tasks)
    .where(and(gte(schema.tasks.dueAt, from), lt(schema.tasks.dueAt, to), agentId ? eq(schema.tasks.agentId, agentId) : undefined))
    .orderBy(asc(schema.tasks.dueAt))
    .all()
    .map((t) => ({ id: t.id, title: t.title, day: dayKey(t.dueAt!), time: toInputDateTime(t.dueAt).slice(11), done: t.done, priority: t.priority }));
}
