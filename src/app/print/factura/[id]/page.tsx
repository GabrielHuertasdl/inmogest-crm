import { notFound, forbidden } from "next/navigation";
import { db, schema } from "@/db";
import { requireUser, can } from "@/lib/auth/guards";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { getInvoice } from "@/lib/queries/invoices";

export const metadata = { title: "Factura" };

export default async function PrintInvoice({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (!can(u, "ver_facturas")) forbidden();
  const inv = getInvoice(Number((await params).id));
  if (!inv) notFound();
  return <InvoiceDocument inv={inv} agency={db.select().from(schema.agency).get()} />;
}
