import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ClipboardSignature, Plus, Trash2 } from "lucide-react";
import { requireUser, canEdit } from "@/lib/auth/guards";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { ActionButton } from "@/components/forms";
import { db, schema } from "@/db";
import { INTEREST_LEVELS } from "@/lib/constants";
import { euros, fmtDateTime } from "@/lib/format";
import { deleteVisitReport } from "./actions";

export const metadata = { title: "Partes de visita" };

export default async function VisitsPage() {
  const u = await requireUser();
  const rows = db
    .select({ v: schema.visitReports, p: schema.properties, c: schema.clients, a: schema.users })
    .from(schema.visitReports)
    .innerJoin(schema.properties, eq(schema.properties.id, schema.visitReports.propertyId))
    .innerJoin(schema.clients, eq(schema.clients.id, schema.visitReports.clientId))
    .leftJoin(schema.users, eq(schema.users.id, schema.visitReports.agentId))
    .orderBy(desc(schema.visitReports.visitedAt))
    .all();
  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeader
        title="Partes de visita"
        subtitle="Hojas de visita firmadas digitalmente"
        actions={
          <Link href="/partes-visita/nuevo" className="btn-primary">
            <Plus className="h-4 w-4" /> Nuevo parte
          </Link>
        }
      />
      {rows.length === 0 ? (
        <EmptyState icon={ClipboardSignature} title="Sin partes de visita" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Propiedad</th>
                <th>Cliente</th>
                <th>Interés</th>
                <th>Valoración</th>
                <th>Oferta</th>
                <th>Firma</th>
                <th>Agente</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ v, p, c, a }) => (
                <tr key={v.id}>
                  <td className="whitespace-nowrap">{fmtDateTime(v.visitedAt)}</td>
                  <td>
                    <Link href={`/propiedades/${p.id}`} className="hover:text-brand-600">
                      <span className="font-semibold text-brand-600">{p.ref}</span> · <span className="inline-block max-w-48 truncate align-bottom">{p.title}</span>
                    </Link>
                  </td>
                  <td>
                    <Link href={`/clientes/${c.id}`} className="hover:text-brand-600">
                      {c.name} {c.surname}
                    </Link>
                  </td>
                  <td>
                    <Badge tone={v.interestLevel === "alto" ? "green" : v.interestLevel === "medio" ? "amber" : "gray"}>{INTEREST_LEVELS[v.interestLevel]}</Badge>
                  </td>
                  <td className="text-amber-500">{v.rating ? "★".repeat(v.rating) : "—"}</td>
                  <td>{v.offerAmount ? euros(v.offerAmount) : "—"}</td>
                  <td>{v.signaturePng ? <Badge tone="green">Firmado</Badge> : <Badge>Sin firma</Badge>}</td>
                  <td className="text-xs">{a?.name}</td>
                  <td className="whitespace-nowrap">
                    <Link href={`/print/parte-visita/${v.id}`} target="_blank" className="btn-ghost btn-sm">
                      Ver
                    </Link>
                    {canEdit(u, v) && (
                      <ActionButton action={deleteVisitReport} fields={{ id: v.id }} className="btn-ghost btn-sm text-red-600" confirm="¿Eliminar este parte de visita?" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </ActionButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
