import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Calculator } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { Badge, Card, EmptyState, PageHeader, Select } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import { ValuationSave } from "@/components/ValuationSave";
import { db, schema } from "@/db";
import { estimate } from "@/lib/valuation";
import { CONDITIONS, PROPERTY_STATUS, PROPERTY_TYPES, STATUS_TONE } from "@/lib/constants";
import { euros, fmt } from "@/lib/format";

export const metadata = { title: "Tasador" };

type SP = { type?: string; operation?: string; area?: string; rooms?: string; baths?: string; condition?: string; city?: string; zone?: string; address?: string; owner?: string; propertyId?: string };

export default async function Tasador({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser();
  const sp = await searchParams;
  let pre = sp;
  if (sp.propertyId && !sp.area) {
    const p = db.select().from(schema.properties).where(eq(schema.properties.id, Number(sp.propertyId))).get();
    if (p) pre = { ...sp, type: p.type, operation: p.operation === "alquiler" ? "alquiler" : "venta", area: String(p.areaBuilt ?? ""), rooms: String(p.rooms ?? ""), baths: String(p.baths ?? ""), condition: p.condition, city: p.city ?? "", zone: p.zone ?? "", address: p.address ?? "" };
  }
  const area = Number(pre.area);
  const result = pre.type && area > 0 ? estimate({ type: pre.type, operation: pre.operation === "alquiler" ? "alquiler" : "venta", area, condition: pre.condition ?? "buen_estado", city: pre.city, zone: pre.zone, excludeId: Number(sp.propertyId) || undefined }) : null;
  const history = db
    .select({ v: schema.valuations, a: schema.users })
    .from(schema.valuations)
    .leftJoin(schema.users, eq(schema.users.id, schema.valuations.agentId))
    .orderBy(desc(schema.valuations.createdAt))
    .limit(10)
    .all();
  const rent = pre.operation === "alquiler";
  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeader title="Tasador de viviendas" subtitle="Valoración orientativa a partir de inmuebles comparables de tu cartera y operaciones cerradas" />
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card title="Datos del inmueble">
          <form className="space-y-4" action="/tasador">
            {sp.propertyId && <input type="hidden" name="propertyId" value={sp.propertyId} />}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="label">Operación</span>
                <Select name="operation" defaultValue={pre.operation ?? "venta"} options={{ venta: "Venta", alquiler: "Alquiler" }} />
              </label>
              <label className="block">
                <span className="label">Tipo</span>
                <Select name="type" defaultValue={pre.type ?? "piso"} options={PROPERTY_TYPES} />
              </label>
              <label className="block">
                <span className="label">Superficie (m²) *</span>
                <input name="area" type="number" min={1} defaultValue={pre.area ?? ""} className="input" required />
              </label>
              <label className="block">
                <span className="label">Estado</span>
                <Select name="condition" defaultValue={pre.condition ?? "buen_estado"} options={CONDITIONS} />
              </label>
              <label className="block">
                <span className="label">Habitaciones</span>
                <input name="rooms" type="number" min={0} defaultValue={pre.rooms ?? ""} className="input" />
              </label>
              <label className="block">
                <span className="label">Baños</span>
                <input name="baths" type="number" min={0} defaultValue={pre.baths ?? ""} className="input" />
              </label>
            </div>
            <label className="block">
              <span className="label">Dirección</span>
              <input name="address" defaultValue={pre.address ?? ""} className="input" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="label">Zona / barrio</span>
                <input name="zone" defaultValue={pre.zone ?? ""} className="input" />
              </label>
              <label className="block">
                <span className="label">Población</span>
                <input name="city" defaultValue={pre.city ?? ""} className="input" />
              </label>
            </div>
            <label className="block">
              <span className="label">Propietario</span>
              <input name="owner" defaultValue={pre.owner ?? ""} className="input" />
            </label>
            <SubmitButton className="btn-primary w-full" pendingText="Calculando…">
              <Calculator className="h-4 w-4" /> Calcular valoración
            </SubmitButton>
          </form>
        </Card>
        <div className="space-y-6">
          {!pre.type || !area ? (
            <EmptyState icon={Calculator} title="Introduce los datos del inmueble" text="Calcularemos una horquilla de precio a partir de inmuebles similares de la zona." />
          ) : !result ? (
            <EmptyState title="Sin comparables suficientes" text="No hay inmuebles del mismo tipo y superficie parecida en tu cartera." />
          ) : (
            <>
              <section className="card overflow-hidden">
                <div className="bg-brand-600 p-6 text-white">
                  <p className="text-sm text-brand-100">Valor estimado {rent ? "(renta mensual)" : ""}</p>
                  <p className="text-4xl font-bold">
                    {euros(result.estimated)}
                    {rent && <span className="text-lg font-normal">/mes</span>}
                  </p>
                  <p className="mt-1 text-sm text-brand-100">
                    Horquilla: {euros(result.low)} – {euros(result.high)} · {euros(result.pricePerM2)}/m² · comparables de {result.scope}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <p className="text-sm text-muted">Basado en {result.comparables.length} inmuebles comparables. Valoración orientativa, no constituye tasación oficial.</p>
                  <ValuationSave values={{ ...pre, ownerName: pre.owner ?? "" }} />
                </div>
              </section>
              <Card title="Comparables utilizados">
                <div className="overflow-x-auto">
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th>Inmueble</th>
                        <th>Zona</th>
                        <th className="text-right">m²</th>
                        <th className="text-right">Precio</th>
                        <th className="text-right">€/m²</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.comparables.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <Link href={`/propiedades/${c.id}`} className="hover:text-brand-600">
                              <span className="font-semibold text-brand-600">{c.ref}</span> · {c.title}
                            </Link>
                          </td>
                          <td className="text-xs">{[c.zone, c.city].filter(Boolean).join(", ")}</td>
                          <td className="text-right">{c.area}</td>
                          <td className="text-right">{euros(c.price)}</td>
                          <td className="text-right font-medium">{euros(c.ppm)}</td>
                          <td>
                            <Badge tone={STATUS_TONE[c.status]}>{PROPERTY_STATUS[c.status]}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
          <Card title="Últimas valoraciones">
            {history.length === 0 ? (
              <p className="text-sm text-muted">Aún no has guardado valoraciones.</p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {history.map(({ v, a }) => (
                  <li key={v.id}>
                    <Link href={`/print/tasacion/${v.id}`} target="_blank" className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                      <span>
                        <span className="font-medium">{PROPERTY_TYPES[v.type]} · {v.area} m²</span>
                        <span className="text-muted"> · {[v.address, v.zone, v.city].filter(Boolean).join(", ")}</span>
                        {v.ownerName && <span className="text-muted"> · {v.ownerName}</span>}
                      </span>
                      <span className="text-right">
                        <span className="font-semibold">{euros(v.estimated)}</span>
                        <span className="block text-xs text-muted">
                          {fmt(v.createdAt)} · {a?.name}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
