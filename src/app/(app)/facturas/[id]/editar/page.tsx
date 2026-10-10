import { notFound, forbidden, redirect } from "next/navigation";
import { requireUser, can } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui";
import { InvoiceForm } from "@/components/InvoiceForm";
import { getInvoice, seriesOptions, invoiceClientOptions } from "@/lib/queries/invoices";
import { agentOptions, propertyOptions } from "@/lib/queries/properties";
import { toInputDate } from "@/lib/format";

export const metadata = { title: "Editar factura" };

export default async function EditInvoice({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (!can(u, "ver_facturas")) forbidden();
  const inv = getInvoice(Number((await params).id));
  if (!inv) notFound();
  if (inv.status !== "borrador") redirect(`/facturas/${inv.id}`);
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader title="Editar borrador" back={`/facturas/${inv.id}`} />
      <InvoiceForm
        initial={{
          id: inv.id,
          seriesId: inv.seriesId,
          issueDate: toInputDate(inv.issueDate),
          dueDate: toInputDate(inv.dueDate),
          clientId: inv.clientId,
          customerName: inv.customerName,
          customerNif: inv.customerNif,
          customerAddress: inv.customerAddress,
          propertyId: inv.propertyId,
          agentId: inv.agentId,
          vatRate: inv.vatRate,
          notes: inv.notes,
          lines: inv.lines.map((l) => ({ concept: l.concept, quantity: String(l.quantity), unitPrice: String(l.unitPriceCents / 100) })),
        }}
        series={seriesOptions()}
        clients={invoiceClientOptions()}
        properties={propertyOptions()}
        agents={agentOptions()}
      />
    </div>
  );
}
