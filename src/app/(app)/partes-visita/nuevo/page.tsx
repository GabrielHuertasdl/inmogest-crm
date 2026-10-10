import { requireUser } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui";
import { VisitReportForm } from "@/components/VisitReportForm";
import { clientOptions, propertyOptions } from "@/lib/queries/properties";
import { toInputDateTime } from "@/lib/format";

export const metadata = { title: "Nuevo parte de visita" };

export default async function NewVisit({ searchParams }: { searchParams: Promise<{ propertyId?: string; clientId?: string; eventId?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Nuevo parte de visita" subtitle="Registro digital con firma del visitante" back="/partes-visita" />
      <VisitReportForm properties={propertyOptions()} clients={clientOptions()} initial={{ ...sp, visitedAt: toInputDateTime(new Date()) }} />
    </div>
  );
}
