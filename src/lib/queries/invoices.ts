import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export function seriesOptions() {
  return db
    .select()
    .from(schema.invoiceSeries)
    .orderBy(asc(schema.invoiceSeries.code))
    .all()
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
    .map((s) => ({ value: s.id, label: `${s.code} · ${s.description ?? ""}`.trim() }));
}

export function invoiceClientOptions() {
  return db
    .select()
    .from(schema.clients)
    .orderBy(asc(schema.clients.name))
    .all()
    .map((c) => ({ id: c.id, label: `${c.name} ${c.surname ?? ""}`.trim() + (c.dni ? ` · ${c.dni}` : ""), name: `${c.name} ${c.surname ?? ""}`.trim(), nif: c.dni, address: c.address }));
}

export function getInvoice(id: number) {
  const inv = db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).get();
  if (!inv) return null;
  const lines = db.select().from(schema.invoiceLines).where(eq(schema.invoiceLines.invoiceId, id)).orderBy(asc(schema.invoiceLines.position)).all();
  const series = db.select().from(schema.invoiceSeries).where(eq(schema.invoiceSeries.id, inv.seriesId)).get();
  const property = inv.propertyId ? db.select().from(schema.properties).where(eq(schema.properties.id, inv.propertyId)).get() : null;
  const agent = inv.agentId ? db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, inv.agentId)).get() : null;
  return { ...inv, lines, series, property, agent };
}
