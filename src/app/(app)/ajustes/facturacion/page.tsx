import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { Card, PageHeader } from "@/components/ui";
import { SeriesForm } from "@/components/SettingsForms";
import { db, schema } from "@/db";
import { madridParts } from "@/lib/format";

export const metadata = { title: "Ajustes · Facturación" };

export default async function BillingSettings() {
  await requireAdmin();
  const series = db.select().from(schema.invoiceSeries).orderBy(asc(schema.invoiceSeries.code)).all();
  const y = madridParts(new Date()).y;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Facturación" subtitle="Series de numeración de facturas" />
      <Card title="Series" subtitle={`Formato del número: CÓDIGO + AÑO + nº correlativo (p. ej. F${y}-0001). El número se asigna al emitir.`}>
        <div className="space-y-4">
          {series.map((s) => (
            <SeriesForm key={s.id} s={s} />
          ))}
          <div className="border-t border-line pt-4">
            <p className="mb-2 text-sm font-medium">Nueva serie</p>
            <SeriesForm />
          </div>
        </div>
      </Card>
    </div>
  );
}
