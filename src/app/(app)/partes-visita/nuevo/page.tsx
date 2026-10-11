import { requireUser } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui";
import { VisitReportForm } from "@/components/VisitReportForm";
import { clientOptions, propertyOptions } from "@/lib/queries/properties";
import { toInputDateTime } from "@/lib/format";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const metadata = { title: "Nuevo parte de visita" };

export default async function NewVisit({ searchParams }: { searchParams: Promise<{ propertyId?: string; clientId?: string; eventId?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const ev = sp.eventId ? db.select().from(schema.events).where(eq(schema.events.id, Number(sp.eventId))).get() : undefined;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Nuevo parte de visita" subtitle="Registro digital con firma del visitante" back="/partes-visita" />
      <VisitReportForm properties={propertyOptions()} clients={clientOptions()} initial={{ ...sp, propertyId: sp.propertyId ?? (ev?.propertyId ? String(ev.propertyId) : undefined), clientId: sp.clientId ?? (ev?.clientId ? String(ev.clientId) : undefined), visitedAt: toInputDateTime(ev?.startsAt ?? new Date()) }} />
    </div>
  );
}
