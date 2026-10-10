import "server-only";
import { and, count, eq, gte, inArray, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { commissionOf } from "./dashboard";

export function agentStats(agentId: number, from: Date, to: Date) {
  const P = schema.properties;
  const props = db.select().from(P).where(eq(P.agentId, agentId)).all();
  const closed = props.filter((p) => (p.status === "vendido" || p.status === "alquilado") && p.closedAt && p.closedAt >= from && p.closedAt < to);
  const capt = db
    .select({ n: count() })
    .from(schema.leads)
    .where(and(eq(schema.leads.agentId, agentId), eq(schema.leads.stage, "captado"), gte(schema.leads.capturedAt, from), lt(schema.leads.capturedAt, to)))
    .get()?.n ?? 0;
  const invoiced = db
    .select({ t: schema.invoices.totalCents })
    .from(schema.invoices)
    .where(and(eq(schema.invoices.agentId, agentId), inArray(schema.invoices.status, ["emitida", "pagada"]), gte(schema.invoices.issueDate, from), lt(schema.invoices.issueDate, to)))
    .all()
    .reduce((s, r) => s + r.t, 0);
  const clients = db.select({ n: count() }).from(schema.clients).where(eq(schema.clients.agentId, agentId)).get()?.n ?? 0;
  const visits = db
    .select({ n: count() })
    .from(schema.events)
    .where(and(eq(schema.events.agentId, agentId), eq(schema.events.kind, "visita"), gte(schema.events.startsAt, from), lt(schema.events.startsAt, to)))
    .get()?.n ?? 0;
  return {
    activas: props.filter((p) => p.status === "disponible" || p.status === "reservado").length,
    ventas: closed.filter((p) => p.status === "vendido").length,
    alquileres: closed.filter((p) => p.status === "alquilado").length,
    comision: closed.reduce((s, p) => s + commissionOf(p), 0),
    captaciones: capt,
    facturadoCents: invoiced,
    clientes: clients,
    visitas: visits,
  };
}
