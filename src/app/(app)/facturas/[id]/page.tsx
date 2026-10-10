import Link from "next/link";
import { notFound, forbidden } from "next/navigation";
import { db, schema } from "@/db";
import { Printer, Pencil, Send, CheckCircle2, Ban, Undo2 } from "lucide-react";
import { requireUser, can } from "@/lib/auth/guards";
import { Badge, PageHeader } from "@/components/ui";
import { ActionButton } from "@/components/forms";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { getInvoice } from "@/lib/queries/invoices";
import { INVOICE_STATUS, INVOICE_STATUS_TONE } from "@/lib/constants";
import { fmt } from "@/lib/format";
import { issueInvoice, markPaid, rectifyInvoice, voidInvoice } from "../actions";

export const metadata = { title: "Factura" };

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (!can(u, "ver_facturas")) forbidden();
  const inv = getInvoice(Number((await params).id));
  if (!inv) notFound();
  const agency = db.select().from(schema.agency).get();
  return (
    <div className="mx-auto max-w-[1000px]">
      <PageHeader
        back="/facturas"
        title={inv.number ?? "Factura en borrador"}
        subtitle={
          <span className="flex items-center gap-2">
            <Badge tone={INVOICE_STATUS_TONE[inv.status]}>{INVOICE_STATUS[inv.status]}</Badge>
            {inv.paidAt && <span>Cobrada el {fmt(inv.paidAt)}</span>}
            {inv.agent && <span>· {inv.agent.name}</span>}
          </span>
        }
        actions={
          <>
            <Link href={`/print/factura/${inv.id}`} target="_blank" className="btn-secondary">
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </Link>
            {inv.status === "borrador" && (
              <>
                <Link href={`/facturas/${inv.id}/editar`} className="btn-secondary">
                  <Pencil className="h-4 w-4" /> Editar
                </Link>
                <ActionButton action={issueInvoice} fields={{ id: inv.id }} className="btn-primary" confirm="Al emitir se asigna un número definitivo y ya no se podrá editar. ¿Emitir factura?">
                  <Send className="h-4 w-4" /> Emitir
                </ActionButton>
                <ActionButton action={voidInvoice} fields={{ id: inv.id }} className="btn-ghost text-red-600" confirm="¿Eliminar este borrador?">
                  Eliminar
                </ActionButton>
              </>
            )}
            {(inv.status === "emitida" || inv.status === "pagada") && (
              <>
                <ActionButton action={markPaid} fields={{ id: inv.id }} className={inv.status === "pagada" ? "btn-secondary" : "btn-primary"}>
                  {inv.status === "pagada" ? (
                    <>
                      <Undo2 className="h-4 w-4" /> Marcar pendiente
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Marcar cobrada
                    </>
                  )}
                </ActionButton>
                <ActionButton action={rectifyInvoice} fields={{ id: inv.id }} className="btn-secondary" confirm="Se creará un borrador de factura rectificativa con importes negativos. ¿Continuar?">
                  Rectificar
                </ActionButton>
                <ActionButton action={voidInvoice} fields={{ id: inv.id }} className="btn-ghost text-red-600" confirm="¿Anular esta factura? Seguirá constando con su número pero no computará en ingresos.">
                  <Ban className="h-4 w-4" /> Anular
                </ActionButton>
              </>
            )}
          </>
        }
      />
      <div className="card overflow-hidden">
        <InvoiceDocument inv={inv} agency={agency} />
      </div>
    </div>
  );
}
