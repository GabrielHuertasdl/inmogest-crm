import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { PrintHeader } from "@/components/PrintHeader";
import { INTEREST_LEVELS, OPERATIONS, PROPERTY_TYPES } from "@/lib/constants";
import { euros, fmtDateTime } from "@/lib/format";

export default async function PrintVisit({ params }: { params: Promise<{ id: string }> }) {
  const row = db
    .select({ v: schema.visitReports, p: schema.properties, c: schema.clients, a: schema.users })
    .from(schema.visitReports)
    .innerJoin(schema.properties, eq(schema.properties.id, schema.visitReports.propertyId))
    .innerJoin(schema.clients, eq(schema.clients.id, schema.visitReports.clientId))
    .leftJoin(schema.users, eq(schema.users.id, schema.visitReports.agentId))
    .where(eq(schema.visitReports.id, Number((await params).id)))
    .get();
  if (!row) notFound();
  const { v, p, c, a } = row;
  const agency = db.select().from(schema.agency).get();
  return (
    <article className="space-y-6 p-10 text-sm">
      <PrintHeader agency={agency} title="PARTE DE VISITA" subtitle={`Nº ${String(v.id).padStart(5, "0")}`} />
      <section className="grid grid-cols-2 gap-6">
        <div>
          <p className="mb-1 text-xs font-semibold text-muted uppercase">Visitante</p>
          <p className="font-semibold">
            {c.name} {c.surname}
          </p>
          <p>DNI: {v.clientDni ?? c.dni ?? "—"}</p>
          <p>{[c.phone, c.email].filter(Boolean).join(" · ")}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-muted uppercase">Inmueble visitado</p>
          <p className="font-semibold">
            {p.ref} · {PROPERTY_TYPES[p.type]} en {OPERATIONS[p.operation]?.toLowerCase()}
          </p>
          <p>{[p.address, p.zone, p.city].filter(Boolean).join(", ")}</p>
          <p>Precio: {euros(p.price)}</p>
        </div>
      </section>
      <section className="rounded-xl border border-line p-4">
        <p>
          <b>Fecha y hora de la visita:</b> {fmtDateTime(v.visitedAt)}
        </p>
        <p>
          <b>Agente:</b> {a?.name ?? "—"}
        </p>
        <p>
          <b>Interés:</b> {INTEREST_LEVELS[v.interestLevel]} {v.rating ? `· Valoración ${v.rating}/5` : ""} {v.offerAmount ? `· Oferta ${euros(v.offerAmount)}` : ""}
        </p>
        {v.feedback && (
          <p className="mt-2 whitespace-pre-line">
            <b>Observaciones:</b> {v.feedback}
          </p>
        )}
      </section>
      <p className="text-xs leading-relaxed text-slate-600">
        El abajo firmante declara haber visitado el inmueble arriba descrito a través de {agency?.legalName ?? agency?.name}, que le ha sido presentado y mostrado por dicha agencia, comprometiéndose a canalizar a través de la misma cualquier negociación relativa a su compra o arrendamiento. Los datos personales se tratan conforme al RGPD para la gestión de la operación.
      </p>
      <section className="grid grid-cols-2 gap-10 pt-6">
        <div>
          <p className="mb-2 text-xs text-muted">Firma del visitante</p>
          {v.signaturePng ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.signaturePng} alt="Firma" className="h-28 w-auto border-b border-ink" />
          ) : (
            <div className="h-28 border-b border-ink" />
          )}
        </div>
        <div>
          <p className="mb-2 text-xs text-muted">Por la agencia</p>
          <div className="flex h-28 items-end border-b border-ink pb-1">{a?.name}</div>
        </div>
      </section>
    </article>
  );
}
