import Link from "next/link";
import { Phone, Users, CalendarCheck2, Signature, AlertTriangle, House, HousePlus, MessageSquareText } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { Card, Stat, Badge } from "@/components/ui";
import { TaskCheck } from "@/components/TaskCheck";
import { MiniCalendar } from "@/components/calendar/MiniCalendar";
import { CaptacionesChart, IncomeChart } from "@/components/charts";
import { DashboardFilters } from "@/components/DashboardFilters";
import { agentsList, captacionesByMonth, incomeByMonth, monthEventDays, overdueTasks, parseRange, quickStats, recentInquiries, todayKpis, todayTasks } from "@/lib/queries/dashboard";
import { cents, dayKey, euros, fmt, fmtTime, madridParts, todayKey } from "@/lib/format";
import { CHANNELS, PRIORITY_TONE, PRIORITIES } from "@/lib/constants";

export const metadata = { title: "Vista general" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const isAdmin = u.role === "admin";
  const range = parseRange(sp, u.id);
  const agentId = isAdmin ? range.agentId : u.id;
  const agents = agentsList().filter((a) => a.active && (isAdmin || a.id === u.id));
  const k = todayKpis(agentId);
  const tasks = todayTasks(agentId);
  const overdue = overdueTasks(agentId);
  const now = madridParts(new Date());
  const days = monthEventDays(now.y, now.m, agentId);
  const capt = captacionesByMonth({ ...range, agentId });
  const inc = incomeByMonth({ ...range, agentId });
  const qs = quickStats(agentId);
  const inq = recentInquiries(agentId);
  const from = dayKey(range.from);
  const to = dayKey(new Date(range.to.getTime() - 1));
  const agentParam = agentId ? String(agentId) : "all";

  return (
    <div className="mx-auto max-w-[1400px]">
      <DashboardFilters agents={agents} agent={agentParam} from={from} to={to} isAdmin={isAdmin} />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card grid gap-4 p-6 sm:grid-cols-2">
            <Stat icon={Phone} tone="blue" label="Llamadas para hoy" value={`${k.llamada.done} de ${k.llamada.total}`} />
            <Stat icon={Users} tone="green" label="Reuniones para hoy" value={`${k.reunion.done} de ${k.reunion.total}`} />
            <Stat icon={CalendarCheck2} tone="violet" label="Visitas para hoy" value={`${k.visita.done} de ${k.visita.total}`} />
            <Stat icon={Signature} tone="amber" label="Firmas para hoy" value={`${k.firma.done} de ${k.firma.total}`} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Tareas para hoy" subtitle="Listado de tareas pendientes de completar." actions={<Link href="/tareas?new=1" className="btn-ghost btn-sm">+ Nueva</Link>}>
              {tasks.length === 0 && overdue.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  <AlertTriangle className="h-5 w-5 text-slate-400" /> No tienes tareas pendientes.
                </div>
              ) : (
                <ul className="space-y-2">
                  {overdue.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/50 px-3 py-2.5">
                      <TaskCheck id={t.id} done={t.done} />
                      <span className="flex-1 text-sm">{t.title}</span>
                      <Badge tone="red">Vencida {fmt(t.dueAt, "dd/MM")}</Badge>
                    </li>
                  ))}
                  {tasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                      <TaskCheck id={t.id} done={t.done} />
                      <span className={`flex-1 text-sm ${t.done ? "text-muted line-through" : ""}`}>{t.title}</span>
                      <span className="text-xs text-muted">{fmtTime(t.dueAt)}</span>
                      <Badge tone={PRIORITY_TONE[t.priority]}>{PRIORITIES[t.priority]}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Resumen" subtitle="Estado actual de tu cartera.">
              <ul className="space-y-3 text-sm">
                {[
                  [House, "Propiedades disponibles", qs.disponibles, "/propiedades?status=disponible"],
                  [House, "Propiedades reservadas", qs.reservadas, "/propiedades?status=reservado"],
                  [House, "Vendidas / alquiladas", qs.cerradas, "/propiedades?status=cerradas"],
                  [Users, "Clientes", qs.clientes, "/clientes"],
                  [HousePlus, "Captaciones en curso", qs.captacionesAbiertas, "/captaciones"],
                ].map(([Icon, label, n, href]) => {
                  const I = Icon as typeof House;
                  return (
                    <li key={label as string}>
                      <Link href={href as string} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                        <I className="h-4 w-4 text-brand-600" />
                        <span className="flex-1">{label as string}</span>
                        <span className="font-semibold">{n as number}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Captaciones" subtitle={`Propiedades captadas por agentes · ${capt.total} en el periodo`}>
              <CaptacionesChart data={capt.data} agents={capt.agents} perAgent={capt.perAgent} />
            </Card>
            <Card title="Últimas consultas" subtitle="Mensajes recientes de clientes." actions={<Link href="/mensajes" className="btn-ghost btn-sm">Ver todos</Link>}>
              {inq.length === 0 ? (
                <p className="text-sm text-muted">Sin consultas.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {inq.map((c) => (
                    <li key={c.id}>
                      <Link href={`/mensajes?c=${c.id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                        <MessageSquareText className="h-4 w-4 shrink-0 text-brand-600" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{[c.clientName, c.clientSurname].filter(Boolean).join(" ") || "Sin cliente"}</p>
                          <p className="truncate text-xs text-muted">{c.subject}</p>
                        </div>
                        <div className="text-right">
                          <Badge>{CHANNELS[c.channel] ?? c.channel}</Badge>
                          <p className="mt-1 text-xs text-muted">{fmt(c.lastMessageAt, "dd MMM")}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <section className="card p-6">
            <MiniCalendar key={agentParam} initial={{ y: now.y, m: now.m, days }} today={todayKey()} agent={agentParam} />
          </section>
          <Card title="Estadísticas de ingresos" subtitle="Ingresos estimados según propiedades que han pasado a Alquilado/Vendido y facturas emitidas.">
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-brand-50 p-3">
                <p className="text-xs text-brand-700">Estimado ({inc.operaciones} op.)</p>
                <p className="text-lg font-bold text-brand-900">{euros(inc.totalEstimado)}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs text-emerald-700">Facturado ({inc.facturas})</p>
                <p className="text-lg font-bold text-emerald-900">{euros(inc.totalFacturado)}</p>
              </div>
            </div>
            <IncomeChart data={inc.data} />
            {inc.pendienteCobro > 0 && <p className="mt-3 text-xs text-muted">Pendiente de cobro: {cents(inc.pendienteCobro * 100)}</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
