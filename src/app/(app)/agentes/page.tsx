import Link from "next/link";
import { asc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { Avatar, Badge, PageHeader } from "@/components/ui";
import { db, schema } from "@/db";
import { agentStats } from "@/lib/queries/agents";
import { ROLES } from "@/lib/constants";
import { cents, euros, fromMadrid, madridParts } from "@/lib/format";

export const metadata = { title: "Agentes inmobiliarios" };

export default async function AgentsPage() {
  const u = await requireUser();
  const y = madridParts(new Date()).y;
  const from = fromMadrid(y, 1, 1);
  const to = fromMadrid(y + 1, 1, 1);
  const users = db.select().from(schema.users).orderBy(asc(schema.users.name)).all();
  const rows = users.map((a) => ({ a, s: agentStats(a.id, from, to) }));
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Agentes inmobiliarios"
        subtitle={`Equipo y resultados de ${y}`}
        actions={
          u.role === "admin" && (
            <Link href="/agentes/nuevo" className="btn-primary">
              <Plus className="h-4 w-4" /> Añadir agente
            </Link>
          )
        }
      />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(({ a, s }) => (
          <Link key={a.id} href={`/agentes/${a.id}`} className={`card p-6 transition hover:shadow-md ${!a.active ? "opacity-60" : ""}`}>
            <div className="flex items-center gap-3">
              <Avatar name={a.name} color={a.color} size={52} src={a.avatarPath ? `/files/${a.avatarPath}` : null} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{a.name}</p>
                <p className="truncate text-xs text-muted">{a.email}</p>
                <div className="mt-1 flex gap-1">
                  <Badge tone={a.role === "admin" ? "violet" : "blue"}>{ROLES[a.role]}</Badge>
                  {!a.active && <Badge>Inactivo</Badge>}
                </div>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
              <div>
                <dt className="text-xs text-muted">Cartera activa</dt>
                <dd className="font-semibold">{s.activas}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Captaciones</dt>
                <dd className="font-semibold">{s.captaciones}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Ventas / alquileres</dt>
                <dd className="font-semibold">
                  {s.ventas} / {s.alquileres}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Comisión estimada</dt>
                <dd className="font-semibold">{euros(s.comision)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-muted">Facturado</dt>
                <dd className="font-semibold text-emerald-700">{cents(s.facturadoCents)}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>
    </div>
  );
}
