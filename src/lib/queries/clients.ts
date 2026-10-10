import "server-only";
import { and, asc, count, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";

export type ClientFilters = { q?: string; kind?: string; status?: string; agent?: string; source?: string; operation?: string; maxBudget?: string; zone?: string; sort?: string; page?: string };

export function listClients(f: ClientFilters, pageSize = 25) {
  const C = schema.clients;
  const PR = schema.clientPreferences;
  const w: (SQL | undefined)[] = [];
  if (f.q) {
    const p = `%${f.q}%`;
    w.push(or(like(sql`${C.name} || ' ' || coalesce(${C.surname}, '')`, p), like(C.email, p), like(C.phone, p), like(C.dni, p), like(C.notes, p)));
  }
  if (f.kind) w.push(eq(C.kind, f.kind));
  if (f.status) w.push(eq(C.status, f.status));
  if (f.agent) w.push(eq(C.agentId, Number(f.agent)));
  if (f.source) w.push(eq(C.source, f.source));
  if (f.operation) w.push(eq(PR.operation, f.operation));
  if (f.maxBudget) w.push(sql`${PR.maxPrice} >= ${Number(f.maxBudget)}`);
  if (f.zone) w.push(like(PR.zones, `%${f.zone}%`));
  const where = and(...w);
  const total = db.select({ n: count() }).from(C).leftJoin(PR, eq(PR.clientId, C.id)).where(where).get()?.n ?? 0;
  const page = Math.max(1, Number(f.page) || 1);
  const order = f.sort === "nombre" ? asc(C.name) : f.sort === "antiguos" ? asc(C.createdAt) : desc(C.createdAt);
  const rows = db
    .select({ c: C, pref: PR, agentName: schema.users.name, agentColor: schema.users.color })
    .from(C)
    .leftJoin(PR, eq(PR.clientId, C.id))
    .leftJoin(schema.users, eq(schema.users.id, C.agentId))
    .where(where)
    .orderBy(order)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all();
  return { rows, total, page, pages: Math.ceil(total / pageSize) };
}

export function getClient(id: number) {
  const row = db
    .select({ c: schema.clients, pref: schema.clientPreferences, agent: schema.users })
    .from(schema.clients)
    .leftJoin(schema.clientPreferences, eq(schema.clientPreferences.clientId, schema.clients.id))
    .leftJoin(schema.users, eq(schema.users.id, schema.clients.agentId))
    .where(eq(schema.clients.id, id))
    .get();
  return row ?? null;
}

export function clientSummary() {
  const rows = db.select({ kind: schema.clients.kind, status: schema.clients.status }).from(schema.clients).all();
  return {
    total: rows.length,
    compradores: rows.filter((r) => r.kind === "comprador").length,
    inquilinos: rows.filter((r) => r.kind === "inquilino").length,
    propietarios: rows.filter((r) => r.kind === "propietario").length,
    activos: rows.filter((r) => ["nuevo", "activo", "en_negociacion"].includes(r.status)).length,
  };
}
