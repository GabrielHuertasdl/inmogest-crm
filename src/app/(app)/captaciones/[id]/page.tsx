import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Pencil, Trash2, HousePlus, Calculator, Phone, CalendarPlus } from "lucide-react";
import { requireUser, canEdit } from "@/lib/auth/guards";
import { Badge, Card, DL, PageHeader, Avatar } from "@/components/ui";
import { ActionButton } from "@/components/forms";
import { db, schema } from "@/db";
import { LEAD_STAGES, LEAD_STAGE_TONE, OPERATIONS, PROPERTY_TYPES } from "@/lib/constants";
import { euros, fmt } from "@/lib/format";
import { deleteLead, moveLead } from "../actions";

export const metadata = { title: "Captación" };

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const id = Number((await params).id);
  const row = db.select({ l: schema.leads, a: schema.users }).from(schema.leads).leftJoin(schema.users, eq(schema.users.id, schema.leads.agentId)).where(eq(schema.leads.id, id)).get();
  if (!row) notFound();
  const { l, a } = row;
  const editable = canEdit(u, l);
  const prop = l.propertyId ? db.select().from(schema.properties).where(eq(schema.properties.id, l.propertyId)).get() : null;
  const stages = Object.keys(LEAD_STAGES);
  const idx = stages.indexOf(l.stage);
  const valuationQs = new URLSearchParams(Object.entries({ type: l.type, operation: l.operation, city: l.city, zone: l.zone, address: l.address, owner: l.ownerName }).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        back="/captaciones"
        title={l.ownerName}
        subtitle={<Badge tone={LEAD_STAGE_TONE[l.stage]}>{LEAD_STAGES[l.stage]}</Badge>}
        actions={
          editable && (
            <>
              {l.phone && (
                <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="btn-secondary">
                  <Phone className="h-4 w-4" /> Llamar
                </a>
              )}
              <Link href={`/tasador?${valuationQs}`} className="btn-secondary">
                <Calculator className="h-4 w-4" /> Valorar
              </Link>
              {!prop && (
                <Link href={`/propiedades/nueva?lead=${l.id}`} className="btn-secondary">
                  <HousePlus className="h-4 w-4" /> Convertir en propiedad
                </Link>
              )}
              <Link href={`/captaciones/${l.id}/editar`} className="btn-primary">
                <Pencil className="h-4 w-4" /> Editar
              </Link>
              <ActionButton action={deleteLead} fields={{ id }} className="btn-ghost text-red-600" confirm="¿Eliminar esta captación?" title="Eliminar">
                <Trash2 className="h-4 w-4" />
              </ActionButton>
            </>
          )
        }
      />
      <div className="card mb-6 overflow-x-auto p-4">
        <ol className="flex min-w-[640px] items-center">
          {stages.map((s, i) => (
            <li key={s} className="flex flex-1 items-center">
              {editable ? (
                <ActionButton action={moveLead} fields={{ id, stage: s }} className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition ${s === l.stage ? "bg-brand-600 text-white" : i < idx && l.stage !== "perdido" ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-100"}`}>
                  {LEAD_STAGES[s]}
                </ActionButton>
              ) : (
                <span className={`w-full rounded-lg px-3 py-2 text-center text-sm ${s === l.stage ? "bg-brand-600 text-white" : "text-slate-500"}`}>{LEAD_STAGES[s]}</span>
              )}
              {i < stages.length - 1 && <span className="mx-1 text-slate-300">›</span>}
            </li>
          ))}
        </ol>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card title="Inmueble">
            <DL
              cols={3}
              items={[
                ["Dirección", l.address],
                ["Población", l.city],
                ["Zona", l.zone],
                ["Tipo", l.type ? PROPERTY_TYPES[l.type] : "—"],
                ["Operación", l.operation ? OPERATIONS[l.operation] : "—"],
                ["Precio esperado", euros(l.expectedPrice)],
              ]}
            />
          </Card>
          <Card title="Notas">{l.notes ? <p className="text-sm whitespace-pre-line">{l.notes}</p> : <p className="text-sm text-muted">Sin notas.</p>}</Card>
        </div>
        <div className="space-y-6">
          <Card title="Contacto">
            <DL cols={2} items={[["Teléfono", l.phone], ["Email", l.email], ["Alta", fmt(l.createdAt)], ["Captada", l.capturedAt ? fmt(l.capturedAt) : "—"]]} />
          </Card>
          {a && (
            <Card title="Agente">
              <div className="flex items-center gap-3 text-sm">
                <Avatar name={a.name} color={a.color} /> {a.name}
              </div>
            </Card>
          )}
          {prop && (
            <Card title="Propiedad creada">
              <Link href={`/propiedades/${prop.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                {prop.ref} · {prop.title}
              </Link>
            </Card>
          )}
          <Link href={`/calendario?new=1&kind=reunion`} className="btn-secondary w-full">
            <CalendarPlus className="h-4 w-4" /> Agendar reunión
          </Link>
        </div>
      </div>
    </div>
  );
}
