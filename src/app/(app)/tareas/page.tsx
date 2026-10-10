import Link from "next/link";
import { and, asc, eq, gte, isNull, lt, or, desc } from "drizzle-orm";
import { ListChecks, Pencil, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { Badge, EmptyState, PageHeader, Avatar } from "@/components/ui";
import { TaskCheck } from "@/components/TaskCheck";
import { TaskModalButton } from "@/components/TaskForm";
import { ActionButton } from "@/components/forms";
import { db, schema } from "@/db";
import { agentOptions, clientOptions, propertyOptions } from "@/lib/queries/properties";
import { dayBounds, fmt, fmtDateTime, nowMs, todayKey, toInputDateTime } from "@/lib/format";
import { PRIORITIES, PRIORITY_TONE } from "@/lib/constants";
import { deleteTask } from "./actions";

export const metadata = { title: "Tareas" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ f?: string; agent?: string }> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const f = sp.f ?? "pendientes";
  const isAdmin = u.role === "admin";
  const agentId = isAdmin ? (sp.agent && sp.agent !== "all" ? Number(sp.agent) : null) : u.id;
  const { start, end } = dayBounds(todayKey());
  const T = schema.tasks;
  const cond =
    f === "hoy"
      ? and(gte(T.dueAt, start), lt(T.dueAt, end))
      : f === "vencidas"
        ? and(lt(T.dueAt, start), eq(T.done, false))
        : f === "completadas"
          ? eq(T.done, true)
          : f === "todas"
            ? undefined
            : eq(T.done, false);
  const rows = db
    .select({ t: T, a: schema.users, c: schema.clients, p: schema.properties })
    .from(T)
    .leftJoin(schema.users, eq(schema.users.id, T.agentId))
    .leftJoin(schema.clients, eq(schema.clients.id, T.clientId))
    .leftJoin(schema.properties, eq(schema.properties.id, T.propertyId))
    .where(and(cond, agentId ? or(eq(T.agentId, agentId), isNull(T.agentId)) : undefined))
    .orderBy(f === "completadas" ? desc(T.doneAt) : asc(T.dueAt))
    .limit(300)
    .all();
  const agents = agentOptions();
  const clients = clientOptions();
  const properties = propertyOptions();
  const tabs = [
    ["pendientes", "Pendientes"],
    ["hoy", "Hoy"],
    ["vencidas", "Vencidas"],
    ["completadas", "Completadas"],
    ["todas", "Todas"],
  ];
  const now = nowMs();
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader title="Tareas" subtitle="Organiza el trabajo pendiente del equipo" actions={<TaskModalButton agents={agents} clients={clients} properties={properties} isAdmin={isAdmin} userId={u.id} />} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabs.map(([k, l]) => (
          <Link key={k} href={`/tareas?f=${k}${sp.agent ? `&agent=${sp.agent}` : ""}`} className={`rounded-lg px-3 py-2 text-sm ${f === k ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>
            {l}
          </Link>
        ))}
        {isAdmin && (
          <div className="ml-auto flex flex-wrap gap-1 text-sm">
            <Link href={`/tareas?f=${f}`} className={`rounded-lg px-3 py-2 ${!sp.agent ? "bg-slate-800 text-white" : "bg-white"}`}>Todos</Link>
            {agents.map((a) => (
              <Link key={a.value} href={`/tareas?f=${f}&agent=${a.value}`} className={`rounded-lg px-3 py-2 ${sp.agent === String(a.value) ? "bg-slate-800 text-white" : "bg-white"}`}>
                {a.label.split(" ")[0]}
              </Link>
            ))}
          </div>
        )}
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={ListChecks} title="No hay tareas" text="¡Todo al día!" />
      ) : (
        <div className="card divide-y divide-line">
          {rows.map(({ t, a, c, p }) => {
            const overdue = !t.done && t.dueAt && t.dueAt.getTime() < now;
            return (
              <div key={t.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <TaskCheck id={t.id} done={t.done} />
                <div className="min-w-56 flex-1">
                  <p className={`font-medium ${t.done ? "text-muted line-through" : ""}`}>{t.title}</p>
                  {t.description && <p className="text-sm text-muted">{t.description}</p>}
                  <div className="mt-1 flex flex-wrap gap-3 text-xs">
                    {c && <Link href={`/clientes/${c.id}`} className="text-brand-600 hover:underline">{c.name} {c.surname}</Link>}
                    {p && <Link href={`/propiedades/${p.id}`} className="text-brand-600 hover:underline">{p.ref}</Link>}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className={overdue ? "font-medium text-red-600" : "text-muted"}>{t.dueAt ? fmtDateTime(t.dueAt) : "Sin fecha"}</p>
                  {t.done && t.doneAt && <p className="text-emerald-600">Hecha {fmt(t.doneAt)}</p>}
                </div>
                <Badge tone={PRIORITY_TONE[t.priority]}>{PRIORITIES[t.priority]}</Badge>
                {a && <Avatar name={a.name} color={a.color} size={28} />}
                <div className="flex gap-1">
                  <TaskModalButton
                    agents={agents}
                    clients={clients}
                    properties={properties}
                    isAdmin={isAdmin}
                    userId={u.id}
                    className="btn-ghost btn-sm"
                    label={<Pencil className="h-4 w-4" />}
                    initial={{ id: t.id, title: t.title, description: t.description, dueAt: toInputDateTime(t.dueAt), priority: t.priority, agentId: t.agentId, clientId: t.clientId, propertyId: t.propertyId }}
                  />
                  <ActionButton action={deleteTask} fields={{ id: t.id }} className="btn-ghost btn-sm text-red-600" confirm="¿Eliminar esta tarea?" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
