import "server-only";
import { and, asc, eq, gte, inArray, isNotNull, lt, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { dayBounds, dayKey, fromMadrid, madridParts, todayKey } from "@/lib/format";

export type Range = { from: Date; to: Date; agentId: number | null };

/** Parse ?from=yyyy-mm-dd&to=…&agent= (defaults: current year, given agent). */
export function parseRange(sp: { from?: string; to?: string; agent?: string }, fallbackAgent: number | null): Range {
  const now = madridParts(new Date());
  const ok = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const from = ok(sp.from) ? dayBounds(sp.from!).start : fromMadrid(now.y, 1, 1);
  const to = ok(sp.to) ? dayBounds(sp.to!).end : fromMadrid(now.y + 1, 1, 1);
  const agentId = sp.agent === "all" ? null : sp.agent ? Number(sp.agent) || null : fallbackAgent;
  return { from, to, agentId };
}

export function monthsBetween(from: Date, to: Date) {
  const a = madridParts(from);
  const b = madridParts(new Date(to.getTime() - 1));
  const out: { key: string; y: number; m: number }[] = [];
  let y = a.y,
    m = a.m;
  while (y < b.y || (y === b.y && m <= b.m)) {
    out.push({ key: `${y}-${String(m).padStart(2, "0")}`, y, m });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
    if (out.length > 60) break;
  }
  return out;
}
const monthKey = (d: Date) => dayKey(d).slice(0, 7);

export function todayKpis(agentId: number | null) {
  const { start, end } = dayBounds(todayKey());
  const rows = db
    .select({ kind: schema.events.kind, done: schema.events.done })
    .from(schema.events)
    .where(and(gte(schema.events.startsAt, start), lt(schema.events.startsAt, end), agentId ? eq(schema.events.agentId, agentId) : undefined))
    .all();
  const k = (kind: string) => {
    const r = rows.filter((x) => x.kind === kind);
    return { done: r.filter((x) => x.done).length, total: r.length };
  };
  return { llamada: k("llamada"), reunion: k("reunion"), visita: k("visita"), firma: k("firma") };
}

export function todayTasks(agentId: number | null) {
  const { end } = dayBounds(todayKey());
  const { start } = dayBounds(todayKey());
  return db
    .select()
    .from(schema.tasks)
    .where(and(lt(schema.tasks.dueAt, end), gte(schema.tasks.dueAt, start), agentId ? eq(schema.tasks.agentId, agentId) : undefined))
    .orderBy(asc(schema.tasks.done), asc(schema.tasks.dueAt))
    .all();
}

export function overdueTasks(agentId: number | null) {
  const { start } = dayBounds(todayKey());
  return db
    .select()
    .from(schema.tasks)
    .where(and(lt(schema.tasks.dueAt, start), eq(schema.tasks.done, false), agentId ? eq(schema.tasks.agentId, agentId) : undefined))
    .orderBy(asc(schema.tasks.dueAt))
    .limit(10)
    .all();
}

/** Days (yyyy-mm-dd) with events for a month, plus per-day kinds. */
export function monthEventDays(y: number, m: number, agentId: number | null) {
  const start = fromMadrid(y, m, 1);
  const end = fromMadrid(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, 1);
  const rows = db
    .select({ startsAt: schema.events.startsAt, kind: schema.events.kind })
    .from(schema.events)
    .where(and(gte(schema.events.startsAt, start), lt(schema.events.startsAt, end), agentId ? eq(schema.events.agentId, agentId) : undefined))
    .all();
  const map: Record<string, string[]> = {};
  for (const r of rows) (map[dayKey(r.startsAt)] ??= []).push(r.kind);
  return map;
}

export function captacionesByMonth(r: Range) {
  const months = monthsBetween(r.from, r.to);
  const agents = db.select({ id: schema.users.id, name: schema.users.name, color: schema.users.color }).from(schema.users).where(r.agentId ? eq(schema.users.id, r.agentId) : undefined).all();
  const leads = db
    .select({ at: schema.leads.capturedAt, agentId: schema.leads.agentId })
    .from(schema.leads)
    .where(and(eq(schema.leads.stage, "captado"), isNotNull(schema.leads.capturedAt), gte(schema.leads.capturedAt, r.from), lt(schema.leads.capturedAt, r.to), r.agentId ? eq(schema.leads.agentId, r.agentId) : undefined))
    .all();
  const data = months.map((mo) => {
    const row: Record<string, number | string> = { month: mo.key, total: 0 };
    for (const a of agents) row[`a${a.id}`] = 0;
    return row;
  });
  for (const l of leads) {
    const row = data.find((d) => d.month === monthKey(l.at!));
    if (!row) continue;
    row.total = (row.total as number) + 1;
    if (l.agentId && `a${l.agentId}` in row) row[`a${l.agentId}`] = (row[`a${l.agentId}`] as number) + 1;
  }
  const perAgent = agents.map((a) => ({ ...a, total: leads.filter((l) => l.agentId === a.id).length })).sort((a, b) => b.total - a.total);
  return { data, agents, perAgent, total: leads.length };
}

export function incomeByMonth(r: Range) {
  const months = monthsBetween(r.from, r.to);
  const closed = db
    .select()
    .from(schema.properties)
    .where(
      and(
        inArray(schema.properties.status, ["vendido", "alquilado"]),
        isNotNull(schema.properties.closedAt),
        gte(schema.properties.closedAt, r.from),
        lt(schema.properties.closedAt, r.to),
        r.agentId ? eq(schema.properties.agentId, r.agentId) : undefined,
      ),
    )
    .all();
  const inv = db
    .select()
    .from(schema.invoices)
    .where(and(inArray(schema.invoices.status, ["emitida", "pagada"]), gte(schema.invoices.issueDate, r.from), lt(schema.invoices.issueDate, r.to), r.agentId ? eq(schema.invoices.agentId, r.agentId) : undefined))
    .all();
  const data = months.map((mo) => ({ month: mo.key, estimado: 0, facturado: 0 }));
  for (const p of closed) {
    const row = data.find((d) => d.month === monthKey(p.closedAt!));
    if (row) row.estimado += commissionOf(p);
  }
  for (const i of inv) {
    const row = data.find((d) => d.month === monthKey(i.issueDate));
    if (row) row.facturado += Math.round(i.totalCents / 100);
  }
  return {
    data,
    totalEstimado: data.reduce((s, d) => s + d.estimado, 0),
    totalFacturado: data.reduce((s, d) => s + d.facturado, 0),
    operaciones: closed.length,
    facturas: inv.length,
    pendienteCobro: inv.filter((i) => i.status === "emitida").reduce((s, i) => s + i.totalCents, 0) / 100,
  };
}

export function commissionOf(p: { operation: string; price: number; closedPrice: number | null; commissionPct: number }) {
  const base = p.closedPrice ?? p.price;
  return Math.round(p.operation === "alquiler" ? (base * p.commissionPct) / 100 : (base * p.commissionPct) / 100);
}

export function quickStats(agentId: number | null) {
  const props = db
    .select({ status: schema.properties.status })
    .from(schema.properties)
    .where(and(ne(schema.properties.status, "borrador"), agentId ? eq(schema.properties.agentId, agentId) : undefined))
    .all();
  const clients = db.select({ id: schema.clients.id }).from(schema.clients).where(agentId ? eq(schema.clients.agentId, agentId) : undefined).all().length;
  const leads = db
    .select({ stage: schema.leads.stage })
    .from(schema.leads)
    .where(agentId ? eq(schema.leads.agentId, agentId) : undefined)
    .all();
  return {
    disponibles: props.filter((p) => p.status === "disponible").length,
    reservadas: props.filter((p) => p.status === "reservado").length,
    cerradas: props.filter((p) => p.status === "vendido" || p.status === "alquilado").length,
    clientes: clients,
    captacionesAbiertas: leads.filter((l) => !["captado", "perdido"].includes(l.stage)).length,
  };
}

export function recentInquiries(agentId: number | null) {
  return db
    .select({ id: schema.conversations.id, subject: schema.conversations.subject, channel: schema.conversations.channel, lastMessageAt: schema.conversations.lastMessageAt, clientName: schema.clients.name, clientSurname: schema.clients.surname })
    .from(schema.conversations)
    .leftJoin(schema.clients, eq(schema.clients.id, schema.conversations.clientId))
    .where(agentId ? eq(schema.conversations.agentId, agentId) : undefined)
    .orderBy(asc(schema.conversations.lastMessageAt))
    .all()
    .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
    .slice(0, 5);
}

export function agentsList() {
  return db.select({ id: schema.users.id, name: schema.users.name, color: schema.users.color, active: schema.users.active }).from(schema.users).orderBy(asc(schema.users.name)).all();
}
