import { eq } from "drizzle-orm";
import { forbidden } from "next/navigation";
import { requireUser, can } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui";
import { InvoiceForm } from "@/components/InvoiceForm";
import { seriesOptions, invoiceClientOptions } from "@/lib/queries/invoices";
import { agentOptions, propertyOptions } from "@/lib/queries/properties";
import { db, schema } from "@/db";
import { daysFromNowKey, todayKey } from "@/lib/format";
import { commissionOf } from "@/lib/queries/dashboard";

export const metadata = { title: "Nueva factura" };

export default async function NewInvoice({ searchParams }: { searchParams: Promise<{ clientId?: string; propertyId?: string }> }) {
  const u = await requireUser();
  if (!can(u, "ver_facturas")) forbidden();
  const sp = await searchParams;
  const clients = invoiceClientOptions();
  const c = sp.clientId ? clients.find((x) => x.id === Number(sp.clientId)) : undefined;
  const prop = sp.propertyId ? db.select().from(schema.properties).where(eq(schema.properties.id, Number(sp.propertyId))).get() : undefined;
  const ag = db.select().from(schema.agency).get();
  const today = todayKey();
  const due = daysFromNowKey(30);
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader title="Nueva factura" back="/facturas" />
      <InvoiceForm
        initial={{
          issueDate: today,
          dueDate: due,
          vatRate: ag?.defaultVat ?? 21,
          agentId: u.id,
          clientId: c?.id,
          customerName: c?.name,
          customerNif: c?.nif,
          customerAddress: c?.address,
          propertyId: prop?.id,
          lines: prop ? [{ concept: `Honorarios de intermediación ${prop.operation === "alquiler" ? "arrendamiento" : "compraventa"} – ${prop.ref} ${prop.title}`, quantity: "1", unitPrice: String(commissionOf(prop)) }] : undefined,
        }}
        series={seriesOptions()}
        clients={clients}
        properties={propertyOptions()}
        agents={agentOptions()}
      />
    </div>
  );
}
