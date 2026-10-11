import { eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { PrintHeader } from "@/components/PrintHeader";
import { CONDITIONS, OPERATIONS, PROPERTY_TYPES } from "@/lib/constants";
import { euros, fmt, parseJsonArray } from "@/lib/format";

export const metadata = { title: "Informe de valoración" };

export default async function PrintValuation({ params }: { params: Promise<{ id: string }> }) {
  const v = db.select().from(schema.valuations).where(eq(schema.valuations.id, Number((await params).id))).get();
  if (!v) notFound();
  const agency = db.select().from(schema.agency).get();
  const ids = parseJsonArray(v.comparableIds).map(Number);
  const comps = ids.length ? db.select().from(schema.properties).where(inArray(schema.properties.id, ids)).all() : [];
  const agent = v.agentId ? db.select().from(schema.users).where(eq(schema.users.id, v.agentId)).get() : null;
  const rent = v.operation === "alquiler";
  return (
    <article className="space-y-6 p-10 text-sm">
      <PrintHeader agency={agency} title="INFORME DE VALORACIÓN" subtitle={fmt(v.createdAt)} />
      <section className="grid grid-cols-2 gap-6">
        <div>
          <p className="mb-1 text-xs font-semibold text-muted uppercase">Inmueble</p>
          <p className="font-semibold">
            {PROPERTY_TYPES[v.type]} · {v.area} m²
          </p>
          <p>{[v.address, v.zone, v.city].filter(Boolean).join(", ")}</p>
          <p>
            {[v.rooms != null && `${v.rooms} hab.`, v.baths != null && `${v.baths} baños`, CONDITIONS[v.condition]].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-muted uppercase">Solicitante</p>
          <p className="font-semibold">{v.ownerName ?? "—"}</p>
          <p>Operación: {OPERATIONS[v.operation]}</p>
          <p>Agente: {agent?.name ?? "—"}</p>
        </div>
      </section>
      <section className="rounded-2xl bg-brand-50 p-6 text-center print:border print:border-line">
        <p className="text-sm text-brand-700">Valor de mercado estimado{rent ? " (renta mensual)" : ""}</p>
        <p className="text-4xl font-bold text-brand-900">{euros(v.estimated)}</p>
        <p className="mt-1 text-brand-700">
          Horquilla {euros(v.estimatedLow)} – {euros(v.estimatedHigh)} · {euros(v.pricePerM2Median)}/m²
        </p>
      </section>
      <section>
        <p className="mb-2 font-semibold">Testigos comparables</p>
        <table className="w-full">
          <thead>
            <tr className="border-y border-line text-left text-xs text-muted uppercase">
              <th className="py-2">Ref.</th>
              <th className="py-2">Zona</th>
              <th className="py-2 text-right">m²</th>
              <th className="py-2 text-right">Precio</th>
              <th className="py-2 text-right">€/m²</th>
            </tr>
          </thead>
          <tbody>
            {comps.map((c) => (
              <tr key={c.id} className="border-b border-line">
                <td className="py-2">{c.ref}</td>
                <td className="py-2">{[c.zone, c.city].filter(Boolean).join(", ")}</td>
                <td className="py-2 text-right">{c.areaBuilt}</td>
                <td className="py-2 text-right">{euros(c.closedPrice ?? c.price)}</td>
                <td className="py-2 text-right">{c.areaBuilt ? euros(Math.round((c.closedPrice ?? c.price) / c.areaBuilt)) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="text-xs text-muted">
        Valoración orientativa elaborada por {agency?.name} a partir de inmuebles comparables en oferta y operaciones cerradas. No constituye una tasación oficial a efectos hipotecarios.
      </p>
    </article>
  );
}
