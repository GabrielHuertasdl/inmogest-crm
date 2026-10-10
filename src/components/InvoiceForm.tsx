"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Select } from "@/components/ui";
import { saveInvoice } from "@/app/(app)/facturas/actions";

type Line = { concept: string; quantity: string; unitPrice: string };
type ClientOpt = { id: number; label: string; name: string; nif: string | null; address: string | null };
export type InvoiceFormValues = {
  id?: number;
  seriesId?: number;
  issueDate?: string;
  dueDate?: string;
  clientId?: number | null;
  customerName?: string;
  customerNif?: string | null;
  customerAddress?: string | null;
  propertyId?: number | null;
  agentId?: number | null;
  vatRate?: number;
  notes?: string | null;
  lines?: Line[];
};

const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const num = (s: string) => Number(String(s).replace(",", ".")) || 0;

export function InvoiceForm({ initial, series, clients, properties, agents }: { initial: InvoiceFormValues; series: { value: number; label: string }[]; clients: ClientOpt[]; properties: { id: number; label: string }[]; agents: { value: number; label: string }[] }) {
  const [lines, setLines] = useState<Line[]>(initial.lines?.length ? initial.lines : [{ concept: "Honorarios de intermediación inmobiliaria", quantity: "1", unitPrice: "" }]);
  const [vat, setVat] = useState(String(initial.vatRate ?? 21));
  const [cust, setCust] = useState({ clientId: initial.clientId ? String(initial.clientId) : "", name: initial.customerName ?? "", nif: initial.customerNif ?? "", address: initial.customerAddress ?? "" });
  const t = useMemo(() => {
    const sub = lines.reduce((s, l) => s + num(l.quantity) * num(l.unitPrice), 0);
    const v = (sub * num(vat)) / 100;
    return { sub, v, total: sub + v };
  }, [lines, vat]);
  const setLine = (i: number, patch: Partial<Line>) => setLines(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  return (
    <ActionForm action={saveInvoice} className="space-y-6">
      {(fe) => (
        <>
          {initial.id && <input type="hidden" name="id" value={initial.id} />}
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-6">
              <h2 className="mb-4 text-lg font-semibold">Cliente</h2>
              <div className="grid gap-4">
                <Field label="Cliente del CRM">
                  <select
                    name="clientId"
                    value={cust.clientId}
                    onChange={(e) => {
                      const c = clients.find((x) => String(x.id) === e.target.value);
                      setCust(c ? { clientId: e.target.value, name: c.name, nif: c.nif ?? "", address: c.address ?? "" } : { ...cust, clientId: "" });
                    }}
                    className="input"
                  >
                    <option value="">— Cliente no registrado —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Nombre / razón social *" error={fe.customerName}>
                  <input name="customerName" value={cust.name} onChange={(e) => setCust({ ...cust, name: e.target.value })} className="input" required />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="NIF / CIF">
                    <input name="customerNif" value={cust.nif} onChange={(e) => setCust({ ...cust, nif: e.target.value })} className="input" />
                  </Field>
                  <Field label="Dirección fiscal">
                    <input name="customerAddress" value={cust.address} onChange={(e) => setCust({ ...cust, address: e.target.value })} className="input" />
                  </Field>
                </div>
              </div>
            </section>
            <section className="card p-6">
              <h2 className="mb-4 text-lg font-semibold">Datos de la factura</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Serie *" error={fe.seriesId}>
                  <Select name="seriesId" defaultValue={String(initial.seriesId ?? series[0]?.value ?? "")} options={series} />
                </Field>
                <Field label="IVA (%)">
                  <input name="vatRate" type="number" min={0} max={100} step="0.01" value={vat} onChange={(e) => setVat(e.target.value)} className="input" />
                </Field>
                <Field label="Fecha de emisión *" error={fe.issueDate}>
                  <input name="issueDate" type="date" defaultValue={initial.issueDate} className="input" required />
                </Field>
                <Field label="Vencimiento">
                  <input name="dueDate" type="date" defaultValue={initial.dueDate} className="input" />
                </Field>
                <Field label="Propiedad relacionada">
                  <Select name="propertyId" defaultValue={initial.propertyId ? String(initial.propertyId) : ""} options={properties.map((p) => ({ value: p.id, label: p.label }))} placeholder="— Ninguna —" />
                </Field>
                <Field label="Agente">
                  <Select name="agentId" defaultValue={initial.agentId ? String(initial.agentId) : ""} options={agents} />
                </Field>
              </div>
            </section>
          </div>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Conceptos</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted uppercase">
                    <th className="pb-2">Concepto</th>
                    <th className="w-24 pb-2">Cantidad</th>
                    <th className="w-36 pb-2">Precio (€)</th>
                    <th className="w-32 pb-2 text-right">Importe</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i}>
                      <td className="py-1 pr-2">
                        <input name="concept[]" value={l.concept} onChange={(e) => setLine(i, { concept: e.target.value })} className="input" placeholder="Descripción del servicio" />
                      </td>
                      <td className="py-1 pr-2">
                        <input name="quantity[]" value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} className="input" inputMode="decimal" />
                      </td>
                      <td className="py-1 pr-2">
                        <input name="unitPrice[]" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: e.target.value })} className="input" inputMode="decimal" placeholder="0,00" />
                      </td>
                      <td className="py-1 text-right font-medium">{eur.format(num(l.quantity) * num(l.unitPrice))}</td>
                      <td className="py-1 text-right">
                        <button type="button" onClick={() => setLines(lines.filter((_, k) => k !== i))} disabled={lines.length === 1} className="rounded p-2 text-slate-400 hover:text-red-600 disabled:opacity-30" aria-label="Quitar línea">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={() => setLines([...lines, { concept: "", quantity: "1", unitPrice: "" }])} className="btn-ghost btn-sm mt-2 text-brand-600">
              <Plus className="h-4 w-4" /> Añadir línea
            </button>
            <div className="mt-6 ml-auto w-full max-w-xs space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Base imponible</span>
                <span>{eur.format(t.sub)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">IVA ({vat}%)</span>
                <span>{eur.format(t.v)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{eur.format(t.total)}</span>
              </div>
            </div>
          </section>

          <section className="card p-6">
            <Field label="Notas / forma de pago">
              <textarea name="notes" rows={3} defaultValue={initial.notes ?? "Forma de pago: transferencia bancaria."} className="input" />
            </Field>
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            <a href={initial.id ? `/facturas/${initial.id}` : "/facturas"} className="btn-secondary">
              Cancelar
            </a>
            <SubmitButton className="btn-secondary">Guardar borrador</SubmitButton>
            <SubmitButton name="emit" value="on" pendingText="Emitiendo…">
              Guardar y emitir
            </SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
