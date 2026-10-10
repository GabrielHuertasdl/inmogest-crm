import type { getInvoice } from "@/lib/queries/invoices";
import type { Agency } from "@/db/schema";
import { cents, fmt } from "@/lib/format";
import { LogoMark } from "@/components/layout/Logo";

export function InvoiceDocument({ inv, agency }: { inv: NonNullable<ReturnType<typeof getInvoice>>; agency: Agency | undefined }) {
  return (
    <article className="mx-auto max-w-[800px] bg-white p-10 text-sm text-ink print:p-0">
      <header className="flex items-start justify-between gap-6 border-b border-line pb-6">
        <div className="flex items-start gap-3">
          {agency?.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/files/${agency.logoPath}`} alt="" className="h-12 w-auto" />
          ) : (
            <LogoMark size={44} />
          )}
          <div>
            <p className="text-base font-semibold">{agency?.legalName ?? agency?.name}</p>
            <p className="text-muted">CIF: {agency?.cif ?? "—"}</p>
            <p className="text-muted">{[agency?.address, agency?.postalCode, agency?.city].filter(Boolean).join(", ")}</p>
            <p className="text-muted">{[agency?.phone, agency?.email].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-tight">{inv.totalCents < 0 ? "FACTURA RECTIFICATIVA" : "FACTURA"}</p>
          <p className="mt-1 text-base font-semibold">{inv.number ?? "BORRADOR"}</p>
          <p className="text-muted">Fecha: {fmt(inv.issueDate)}</p>
          {inv.dueDate && <p className="text-muted">Vencimiento: {fmt(inv.dueDate)}</p>}
        </div>
      </header>
      <section className="grid grid-cols-2 gap-6 py-6">
        <div>
          <p className="mb-1 text-xs font-semibold text-muted uppercase">Facturar a</p>
          <p className="font-semibold">{inv.customerName}</p>
          {inv.customerNif && <p>NIF: {inv.customerNif}</p>}
          {inv.customerAddress && <p>{inv.customerAddress}</p>}
        </div>
        {inv.property && (
          <div>
            <p className="mb-1 text-xs font-semibold text-muted uppercase">Inmueble</p>
            <p className="font-semibold">{inv.property.ref}</p>
            <p>{[inv.property.address, inv.property.city].filter(Boolean).join(", ")}</p>
          </div>
        )}
      </section>
      <table className="w-full">
        <thead>
          <tr className="border-y border-line text-left text-xs text-muted uppercase">
            <th className="py-2">Concepto</th>
            <th className="w-20 py-2 text-right">Cant.</th>
            <th className="w-32 py-2 text-right">Precio</th>
            <th className="w-32 py-2 text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {inv.lines.map((l) => (
            <tr key={l.id} className="border-b border-line">
              <td className="py-3">{l.concept}</td>
              <td className="py-3 text-right">{l.quantity.toLocaleString("es-ES")}</td>
              <td className="py-3 text-right">{cents(l.unitPriceCents)}</td>
              <td className="py-3 text-right">{cents(Math.round(l.quantity * l.unitPriceCents))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6 ml-auto w-72 space-y-2">
        <div className="flex justify-between">
          <span className="text-muted">Base imponible</span>
          <span>{cents(inv.subtotalCents)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">IVA {inv.vatRate.toLocaleString("es-ES")}%</span>
          <span>{cents(inv.vatCents)}</span>
        </div>
        <div className="flex justify-between border-t border-line pt-2 text-lg font-bold">
          <span>Total</span>
          <span>{cents(inv.totalCents)}</span>
        </div>
      </div>
      {inv.notes && <p className="mt-10 border-t border-line pt-4 whitespace-pre-line text-muted">{inv.notes}</p>}
      {inv.status === "anulada" && <p className="mt-6 text-center text-2xl font-bold text-red-600">ANULADA</p>}
    </article>
  );
}
