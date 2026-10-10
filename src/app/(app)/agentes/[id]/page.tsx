import Link from "next/link";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Pencil, Phone, Mail } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { Avatar, Badge, Card, PageHeader, Stat } from "@/components/ui";
import { SimpleBars } from "@/components/charts";
import { db, schema } from "@/db";
import { agentStats } from "@/lib/queries/agents";
import { commissionOf } from "@/lib/queries/dashboard";
import { PERMISSIONS, PROPERTY_STATUS, ROLES, STATUS_TONE } from "@/lib/constants";
import { cents, euros, fmt, fromMadrid, madridParts, parseJsonArray } from "@/lib/format";

export const metadata = { title: "Agente" };
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default async function AgentDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ year?: string }> }) {
  const u = await requireUser();
  const id = Number((await params).id);
  const a = db.select().from(schema.users).where(eq(schema.users.id, id)).get();
  if (!a) notFound();
  const nowY = madridParts(new Date()).y;
  const y = Number((await searchParams).year) || nowY;
  const from = fromMadrid(y, 1, 1);
  const to = fromMadrid(y + 1, 1, 1);
  const s = agentStats(id, from, to);
  const closed = db
    .select()
    .from(schema.properties)
    .where(and(eq(schema.properties.agentId, id), gte(schema.properties.closedAt, from), lt(schema.properties.closedAt, to)))
    .all();
  const byMonth = MONTHS.map((label, i) => ({ label, value: closed.filter((p) => madridParts(p.closedAt!).m === i + 1).reduce((sum, p) => sum + commissionOf(p), 0) }));
  const recent = db.select().from(schema.properties).where(eq(schema.properties.agentId, id)).orderBy(desc(schema.properties.createdAt)).limit(8).all();
  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeader
        back="/agentes"
        title={
          <span className="flex items-center gap-3">
            <Avatar name={a.name} color={a.color} size={48} src={a.avatarPath ? `/files/${a.avatarPath}` : null} /> {a.name}
          </span>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={a.role === "admin" ? "violet" : "blue"}>{ROLES[a.role]}</Badge>
            {!a.active && <Badge>Inactivo</Badge>}
            {a.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {a.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> {a.email}
            </span>
          </span>
        }
        actions={
          <>
            {[nowY - 1, nowY].map((yy) => (
              <Link key={yy} href={`/agentes/${id}?year=${yy}`} className={`rounded-lg px-3 py-2 text-sm ${y === yy ? "bg-slate-800 text-white" : "bg-white"}`}>
                {yy}
              </Link>
            ))}
            {u.role === "admin" && (
              <Link href={`/agentes/${id}/editar`} className="btn-primary">
                <Pencil className="h-4 w-4" /> Editar
              </Link>
            )}
          </>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Cartera activa" value={s.activas} tone="blue" />
        <Stat label="Captaciones" value={s.captaciones} tone="green" />
        <Stat label="Ventas / alquileres" value={`${s.ventas} / ${s.alquileres}`} tone="violet" />
        <Stat label="Facturado" value={cents(s.facturadoCents)} tone="amber" hint={`Comisión estimada ${euros(s.comision)}`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card title="Comisiones por mes" subtitle={`Operaciones cerradas en ${y}`}>
          <SimpleBars data={byMonth} money />
        </Card>
        <Card title="Actividad">
          <dl className="space-y-3 text-sm">
            {[
              ["Clientes asignados", s.clientes],
              ["Visitas en el año", s.visitas],
              ["Alta en el CRM", fmt(a.createdAt)],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between">
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {a.role !== "admin" && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-2 text-xs text-muted">Permisos</p>
              <div className="flex flex-wrap gap-1">
                {parseJsonArray(a.permissions).map((p) => (
                  <Badge key={p}>{PERMISSIONS[p] ?? p}</Badge>
                ))}
                {parseJsonArray(a.permissions).length === 0 && <span className="text-sm text-muted">Básicos</span>}
              </div>
            </div>
          )}
        </Card>
      </div>
      <Card title="Últimas propiedades" className="mt-6" actions={<Link href={`/propiedades?agent=${id}`} className="btn-ghost btn-sm">Ver todas</Link>}>
        <ul className="divide-y divide-line">
          {recent.map((p) => (
            <li key={p.id}>
              <Link href={`/propiedades/${p.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:opacity-80">
                <span className="truncate">
                  <span className="font-semibold text-brand-600">{p.ref}</span> · {p.title}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-medium">{euros(p.price)}</span>
                  <Badge tone={STATUS_TONE[p.status]}>{PROPERTY_STATUS[p.status]}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
