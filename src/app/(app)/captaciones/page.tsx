import Link from "next/link";
import { desc, eq, and, like, or } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, LayoutGrid, List, HousePlus } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { Avatar, Badge, EmptyState, PageHeader } from "@/components/ui";
import { LeadBoard } from "@/components/LeadBoard";
import { db, schema } from "@/db";
import { agentOptions } from "@/lib/queries/properties";
import { LEAD_STAGES, LEAD_STAGE_TONE, PROPERTY_TYPES } from "@/lib/constants";
import { euros, fmt } from "@/lib/format";

export const metadata = { title: "Captaciones" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ view?: string; agent?: string; q?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const view = sp.view === "list" ? "list" : "board";
  const L = schema.leads;
  const rows = db
    .select({ l: L, a: schema.users })
    .from(L)
    .leftJoin(schema.users, eq(schema.users.id, L.agentId))
    .where(and(sp.agent ? eq(L.agentId, Number(sp.agent)) : undefined, sp.q ? or(like(L.ownerName, `%${sp.q}%`), like(L.address, `%${sp.q}%`), like(L.phone, `%${sp.q}%`), like(L.zone, `%${sp.q}%`)) : undefined))
    .orderBy(desc(L.createdAt))
    .all();
  const agents = agentOptions(false);
  const perAgent = agents
    .map((a) => ({ ...a, open: rows.filter((r) => r.l.agentId === a.value && !["captado", "perdido"].includes(r.l.stage)).length, won: rows.filter((r) => r.l.agentId === a.value && r.l.stage === "captado").length }))
    .filter((a) => a.open + a.won > 0);
  const won = rows.filter((r) => r.l.stage === "captado").length;
  const lost = rows.filter((r) => r.l.stage === "perdido").length;
  const rate = won + lost ? Math.round((won / (won + lost)) * 100) : 0;
  const link = (patch: Record<string, string | undefined>) => `/captaciones?${new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]).toString()}`;
  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        title="Captaciones"
        subtitle="Propietarios e inmuebles en proceso de captación"
        actions={
          <>
            <div className="flex rounded-lg border border-line bg-white p-0.5">
              <Link href={link({ view: undefined })} className={`rounded-md p-2 ${view === "board" ? "bg-brand-50 text-brand-700" : "text-slate-500"}`} aria-label="Tablero">
                <LayoutGrid className="h-4 w-4" />
              </Link>
              <Link href={link({ view: "list" })} className={`rounded-md p-2 ${view === "list" ? "bg-brand-50 text-brand-700" : "text-slate-500"}`} aria-label="Lista">
                <List className="h-4 w-4" />
              </Link>
            </div>
            <Link href="/captaciones/nueva" className="btn-primary">
              <Plus className="h-4 w-4" /> Nueva captación
            </Link>
          </>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-muted">En curso</p>
          <p className="mt-1 text-xl font-bold">{rows.length - won - lost}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Captadas</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">{won}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Ratio de éxito</p>
          <p className="mt-1 text-xl font-bold">{rate}%</p>
        </div>
        <div className="card p-4">
          <p className="mb-2 text-xs text-muted">Por agente (en curso / captadas)</p>
          <div className="flex flex-wrap gap-2">
            {perAgent.map((a) => (
              <Link key={a.value} href={link({ agent: sp.agent === String(a.value) ? undefined : String(a.value) })} className={`rounded-full px-2 py-0.5 text-xs ${sp.agent === String(a.value) ? "bg-brand-600 text-white" : "bg-slate-100"}`}>
                {a.label.split(" ")[0]} {a.open}/{a.won}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <form className="mb-4" action="/captaciones">
        {sp.view && <input type="hidden" name="view" value={sp.view} />}
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar propietario, dirección, teléfono…" className="input max-w-md" />
      </form>
      {rows.length === 0 ? (
        <EmptyState icon={HousePlus} title="Sin captaciones" action={<Link href="/captaciones/nueva" className="btn-primary">Nueva captación</Link>} />
      ) : view === "board" ? (
        <LeadBoard
          leads={rows.map(({ l, a }) => ({
            id: l.id,
            ownerName: l.ownerName,
            phone: l.phone,
            address: l.address,
            city: l.city,
            zone: l.zone,
            type: l.type,
            expectedPrice: l.expectedPrice,
            stage: l.stage,
            agentName: a?.name ?? null,
            agentColor: a?.color ?? null,
            propertyId: l.propertyId,
            age: formatDistanceToNow(l.createdAt, { locale: es, addSuffix: true }),
          }))}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Propietario</th>
                <th>Inmueble</th>
                <th>Precio esperado</th>
                <th>Etapa</th>
                <th>Agente</th>
                <th>Alta</th>
                <th>Captada</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ l, a }) => (
                <tr key={l.id}>
                  <td>
                    <Link href={`/captaciones/${l.id}`} className="font-medium hover:text-brand-600">
                      {l.ownerName}
                    </Link>
                    <p className="text-xs text-muted">{l.phone}</p>
                  </td>
                  <td className="text-xs">
                    {l.type ? PROPERTY_TYPES[l.type] : "—"}
                    <p className="text-muted">{[l.address, l.zone, l.city].filter(Boolean).join(", ")}</p>
                  </td>
                  <td>{euros(l.expectedPrice)}</td>
                  <td>
                    <Badge tone={LEAD_STAGE_TONE[l.stage]}>{LEAD_STAGES[l.stage]}</Badge>
                  </td>
                  <td>{a && <Avatar name={a.name} color={a.color} size={26} />}</td>
                  <td className="text-xs text-muted">{fmt(l.createdAt)}</td>
                  <td className="text-xs">{l.capturedAt ? fmt(l.capturedAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
