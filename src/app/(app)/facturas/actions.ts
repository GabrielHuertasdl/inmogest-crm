"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser, requireAdmin, can, ActionError } from "@/lib/auth/guards";
import { fail, parse, zs, type ActionState } from "@/lib/actions";
import { fromInputDate, madridParts } from "@/lib/format";

const InvoiceSchema = z.object({
  id: zs.id,
  seriesId: z.coerce.number().int().positive("Selecciona una serie"),
  issueDate: zs.req("Fecha obligatoria"),
  dueDate: zs.str,
  clientId: zs.id,
  customerName: zs.req("Nombre del cliente obligatorio"),
  customerNif: zs.str,
  customerAddress: zs.str,
  propertyId: zs.id,
  agentId: zs.id,
  vatRate: z.coerce.number().min(0).max(100).default(21),
  notes: zs.str,
  concept: z.array(z.string()).default([]),
  quantity: z.array(z.string()).default([]),
  unitPrice: z.array(z.string()).default([]),
  emit: zs.bool,
});

function totals(lines: { quantity: number; unitPriceCents: number }[], vatRate: number) {
  const sub = Math.round(lines.reduce((s, l) => s + l.quantity * l.unitPriceCents, 0));
  const vat = Math.round((sub * vatRate) / 100);
  return { subtotalCents: sub, vatCents: vat, totalCents: sub + vat };
}

/** Atomically assigns the next number of the series (FYYYY-0001). Must run inside a transaction. */
function assignNumber(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], seriesId: number, issueDate: Date) {
  const s = tx.select().from(schema.invoiceSeries).where(eq(schema.invoiceSeries.id, seriesId)).get();
  if (!s) throw new ActionError("Serie no encontrada");
  tx.update(schema.invoiceSeries).set({ nextNumber: s.nextNumber + 1 }).where(eq(schema.invoiceSeries.id, seriesId)).run();
  return `${s.code}${madridParts(issueDate).y}-${String(s.nextNumber).padStart(4, "0")}`;
}

export async function saveInvoice(_: ActionState, fd: FormData): Promise<ActionState> {
  let id: number;
  try {
    const u = await requireUser();
    if (!can(u, "ver_facturas")) throw new ActionError("No tienes permiso para facturar");
    const p = parse(InvoiceSchema, fd);
    if ("state" in p) return p.state;
    const d = p.data;
    const lines = d.concept
      .map((c, i) => ({ concept: c.trim(), quantity: Number(String(d.quantity[i] ?? "1").replace(",", ".")) || 0, unitPriceCents: Math.round(Number(String(d.unitPrice[i] ?? "0").replace(",", ".")) * 100) || 0 }))
      .filter((l) => l.concept);
    if (!lines.length) return { ok: false, error: "Añade al menos una línea con concepto" };
    if (lines.some((l) => l.quantity <= 0)) return { ok: false, error: "Las cantidades deben ser mayores que 0" };
    const issue = fromInputDate(d.issueDate)!;
    const t = totals(lines, d.vatRate);
    if (d.id) {
      const prev = db.select().from(schema.invoices).where(eq(schema.invoices.id, d.id)).get();
      if (!prev) throw new ActionError("Factura no encontrada");
      if (prev.status !== "borrador") throw new ActionError("Solo se pueden editar facturas en borrador");
    }
    const values = {
      seriesId: d.seriesId,
      issueDate: issue,
      dueDate: fromInputDate(d.dueDate),
      clientId: d.clientId ?? null,
      customerName: d.customerName,
      customerNif: d.customerNif ?? null,
      customerAddress: d.customerAddress ?? null,
      propertyId: d.propertyId ?? null,
      agentId: d.agentId ?? u.id,
      vatRate: d.vatRate,
      notes: d.notes ?? null,
      ...t,
    };
    id = db.transaction((tx) => {
      let iid = d.id;
      if (iid) tx.update(schema.invoices).set(values).where(eq(schema.invoices.id, iid)).run();
      else iid = tx.insert(schema.invoices).values({ ...values, status: "borrador" }).returning({ id: schema.invoices.id }).get().id;
      tx.delete(schema.invoiceLines).where(eq(schema.invoiceLines.invoiceId, iid)).run();
      lines.forEach((l, i) => tx.insert(schema.invoiceLines).values({ invoiceId: iid!, ...l, position: i }).run());
      if (d.emit) tx.update(schema.invoices).set({ status: "emitida", number: assignNumber(tx, d.seriesId, issue) }).where(eq(schema.invoices.id, iid)).run();
      return iid;
    });
    revalidatePath("/", "layout");
  } catch (e) {
    return fail(e);
  }
  redirect(`/facturas/${id}`);
}

async function load(fd: FormData) {
  const u = await requireUser();
  if (!can(u, "ver_facturas")) throw new ActionError("No tienes permiso");
  const inv = db.select().from(schema.invoices).where(eq(schema.invoices.id, Number(fd.get("id")))).get();
  if (!inv) throw new ActionError("Factura no encontrada");
  return inv;
}

export async function issueInvoice(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const inv = await load(fd);
    if (inv.status !== "borrador") throw new ActionError("La factura ya está emitida");
    db.transaction((tx) => tx.update(schema.invoices).set({ status: "emitida", number: assignNumber(tx, inv.seriesId, inv.issueDate) }).where(eq(schema.invoices.id, inv.id)).run());
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function markPaid(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const inv = await load(fd);
    if (inv.status === "borrador" || inv.status === "anulada") throw new ActionError("Solo facturas emitidas pueden marcarse como pagadas");
    db.update(schema.invoices)
      .set(inv.status === "pagada" ? { status: "emitida", paidAt: null } : { status: "pagada", paidAt: new Date() })
      .where(eq(schema.invoices.id, inv.id))
      .run();
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function voidInvoice(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const inv = await load(fd);
    if (inv.status === "borrador") {
      db.delete(schema.invoices).where(eq(schema.invoices.id, inv.id)).run();
      revalidatePath("/", "layout");
      redirect("/facturas");
    }
    db.update(schema.invoices).set({ status: "anulada" }).where(eq(schema.invoices.id, inv.id)).run();
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function rectifyInvoice(_: ActionState, fd: FormData): Promise<ActionState> {
  let newId: number;
  try {
    const inv = await load(fd);
    if (inv.status === "borrador") throw new ActionError("No se puede rectificar un borrador");
    const r = db.select().from(schema.invoiceSeries).where(eq(schema.invoiceSeries.code, "R")).get();
    const lines = db.select().from(schema.invoiceLines).where(eq(schema.invoiceLines.invoiceId, inv.id)).all();
    newId = db.transaction((tx) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, number, createdAt, paidAt, ...rest } = inv;
      const nid = tx
        .insert(schema.invoices)
        .values({ ...rest, seriesId: r?.id ?? inv.seriesId, status: "borrador", issueDate: new Date(), subtotalCents: -inv.subtotalCents, vatCents: -inv.vatCents, totalCents: -inv.totalCents, notes: `Rectifica la factura ${inv.number}` })
        .returning({ id: schema.invoices.id })
        .get().id;
      lines.forEach((l, i) => tx.insert(schema.invoiceLines).values({ invoiceId: nid, concept: `Rectificación: ${l.concept}`, quantity: -l.quantity, unitPriceCents: l.unitPriceCents, position: i }).run());
      return nid;
    });
    revalidatePath("/facturas");
  } catch (e) {
    return fail(e);
  }
  redirect(`/facturas/${newId}/editar`);
}

const SeriesSchema = z.object({ id: zs.id, code: z.string().trim().min(1).max(6).regex(/^[A-Z0-9]+$/i, "Solo letras y números"), description: zs.str, nextNumber: z.coerce.number().int().min(1).default(1), isDefault: zs.bool });

export async function saveSeries(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const p = parse(SeriesSchema, fd);
    if ("state" in p) return p.state;
    const d = p.data;
    db.transaction((tx) => {
      if (d.isDefault) tx.update(schema.invoiceSeries).set({ isDefault: false }).run();
      const v = { code: d.code.toUpperCase(), description: d.description ?? null, nextNumber: d.nextNumber, isDefault: d.isDefault };
      if (d.id) tx.update(schema.invoiceSeries).set(v).where(eq(schema.invoiceSeries.id, d.id)).run();
      else tx.insert(schema.invoiceSeries).values(v).run();
    });
    revalidatePath("/ajustes/facturacion");
    return { ok: true, message: "Serie guardada" };
  } catch (e) {
    return fail(e);
  }
}
