import Link from "next/link";
import { and, asc, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { MessageSquareText, UserPlus, Trash2, MailOpen, House, User } from "lucide-react";
import clsx from "clsx";
import { requireUser } from "@/lib/auth/guards";
import { Avatar, Badge, EmptyState, PageHeader } from "@/components/ui";
import { ActionButton } from "@/components/forms";
import { ReadMarker, ReplyBox, ScrollBottom } from "@/components/MessageThread";
import { NewConversation } from "@/components/NewConversation";
import { db, schema } from "@/db";
import { agentOptions, clientOptions, propertyOptions } from "@/lib/queries/properties";
import { CHANNELS } from "@/lib/constants";
import { fmt, fmtDateTime, fmtTime, dayKey } from "@/lib/format";
import { deleteConversation, markUnread } from "./actions";

export const metadata = { title: "Mensajes" };

const TEMPLATES = [
  "¡Hola! Gracias por tu interés. El inmueble sigue disponible. ¿Qué día y hora te vendría bien para visitarlo?",
  "Hola, te envío por aquí la información solicitada. Si tienes cualquier duda, estoy a tu disposición.",
  "Hola, el propietario está abierto a escuchar ofertas. ¿Quieres que concertemos una visita?",
  "Gracias por contactar con nosotros. Te llamamos en breve para ampliarte la información.",
];

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ c?: string; f?: string; q?: string }> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const f = sp.f ?? "todos";
  const isAdmin = u.role === "admin";
  const C = schema.conversations;
  const unreadSql = sql<number>`(select count(*) from messages m where m.conversation_id = ${C.id} and m.read_at is null and m.direction = 'entrante')`;
  const lastSql = sql<string>`(select body from messages m where m.conversation_id = ${C.id} order by m.created_at desc, m.id desc limit 1)`;
  const list = db
    .select({ conv: C, unread: unreadSql, last: lastSql, client: schema.clients })
    .from(C)
    .leftJoin(schema.clients, eq(schema.clients.id, C.clientId))
    .where(
      and(
        isAdmin ? undefined : or(eq(C.agentId, u.id), isNull(C.agentId)),
        f === "web" ? eq(C.channel, "web") : f === "portal" ? eq(C.channel, "portal") : f === "internos" ? eq(C.channel, "interno") : undefined,
        sp.q ? or(like(C.subject, `%${sp.q}%`), like(schema.clients.name, `%${sp.q}%`), like(schema.clients.surname, `%${sp.q}%`)) : undefined,
      ),
    )
    .orderBy(desc(C.lastMessageAt))
    .all()
    .filter((r) => f !== "noleidos" || r.unread > 0);
  const activeId = sp.c ? Number(sp.c) : null;
  const active = activeId ? db.select().from(C).where(eq(C.id, activeId)).get() : null;
  const thread = active
    ? db
        .select({ m: schema.messages, a: schema.users })
        .from(schema.messages)
        .leftJoin(schema.users, eq(schema.users.id, schema.messages.authorUserId))
        .where(eq(schema.messages.conversationId, active.id))
        .orderBy(asc(schema.messages.createdAt), asc(schema.messages.id))
        .all()
    : [];
  const client = active?.clientId ? db.select().from(schema.clients).where(eq(schema.clients.id, active.clientId)).get() : null;
  const prop = active?.propertyId ? db.select().from(schema.properties).where(eq(schema.properties.id, active.propertyId)).get() : null;
  const hasUnread = thread.some((t) => !t.m.readAt && t.m.direction === "entrante");
  const firstIncoming = thread.find((t) => t.m.direction === "entrante")?.m;
  const totalUnread = list.reduce((s, r) => s + (r.unread > 0 ? 1 : 0), 0);
  const qs = (patch: Record<string, string | undefined>) => `/mensajes?${new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]).toString()}`;

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader title="Mensajes" subtitle={`${totalUnread} conversaciones sin leer`} actions={<NewConversation clients={clientOptions()} properties={propertyOptions()} agents={agentOptions()} />} />
      <div className="card grid min-h-[70vh] overflow-hidden lg:grid-cols-[380px_1fr]">
        <aside className={clsx("flex flex-col border-r border-line", active && "hidden lg:flex")}>
          <div className="space-y-3 border-b border-line p-4">
            <form action="/mensajes">
              {sp.f && <input type="hidden" name="f" value={sp.f} />}
              <input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar conversación…" className="input" />
            </form>
            <div className="flex flex-wrap gap-1 text-xs">
              {[
                ["todos", "Todos"],
                ["noleidos", "No leídos"],
                ["web", "Web"],
                ["portal", "Portales"],
                ["internos", "Internos"],
              ].map(([k, l]) => (
                <Link key={k} href={qs({ f: k === "todos" ? undefined : k, c: undefined })} className={clsx("rounded-full px-3 py-1", f === k ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                  {l}
                </Link>
              ))}
            </div>
          </div>
          <ul className="flex-1 divide-y divide-line overflow-y-auto">
            {list.length === 0 && <li className="p-8 text-center text-sm text-muted">Sin conversaciones</li>}
            {list.map(({ conv, unread, last, client: cl }) => {
              const name = cl ? `${cl.name} ${cl.surname ?? ""}`.trim() : conv.subject;
              const isToday = dayKey(conv.lastMessageAt) === dayKey(new Date());
              return (
                <li key={conv.id}>
                  <Link href={qs({ c: String(conv.id) })} className={clsx("flex gap-3 px-4 py-3 transition", conv.id === activeId ? "bg-brand-50" : "hover:bg-slate-50")}>
                    <Avatar name={name} size={40} color={unread ? "#3463e6" : "#94a3b8"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={clsx("truncate text-sm", unread ? "font-semibold" : "font-medium")}>{name}</p>
                        <span className="shrink-0 text-xs text-muted">{isToday ? fmtTime(conv.lastMessageAt) : fmt(conv.lastMessageAt, "dd MMM")}</span>
                      </div>
                      <p className="truncate text-xs text-slate-500">{conv.subject}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className={clsx("flex-1 truncate text-xs", unread ? "text-ink" : "text-muted")}>{last}</p>
                        {unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">{unread}</span>}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className={clsx("flex min-h-0 flex-col", !active && "hidden lg:flex")}>
          {!active ? (
            <div className="grid flex-1 place-items-center p-8">
              <EmptyState icon={MessageSquareText} title="Selecciona una conversación" text="Aquí verás las consultas que llegan desde tu página web, los portales y los mensajes internos del equipo." />
            </div>
          ) : (
            <>
              <ReadMarker id={active.id} hasUnread={hasUnread} />
              <header className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-4">
                <Link href={qs({ c: undefined })} className="btn-ghost btn-sm lg:hidden">
                  ←
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{active.subject}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <Badge>{CHANNELS[active.channel] ?? active.channel}</Badge>
                    {client && (
                      <Link href={`/clientes/${client.id}`} className="flex items-center gap-1 text-brand-600 hover:underline">
                        <User className="h-3.5 w-3.5" /> {client.name} {client.surname}
                      </Link>
                    )}
                    {prop && (
                      <Link href={`/propiedades/${prop.id}`} className="flex items-center gap-1 text-brand-600 hover:underline">
                        <House className="h-3.5 w-3.5" /> {prop.ref}
                      </Link>
                    )}
                    {firstIncoming?.senderEmail && <span>{firstIncoming.senderEmail}</span>}
                    {firstIncoming?.senderPhone && <span>{firstIncoming.senderPhone}</span>}
                  </div>
                </div>
                {!client && active.channel !== "interno" && (
                  <Link href={`/clientes/nuevo?conversation=${active.id}`} className="btn-secondary btn-sm">
                    <UserPlus className="h-4 w-4" /> Crear cliente
                  </Link>
                )}
                <ActionButton action={markUnread} fields={{ id: active.id }} className="btn-ghost btn-sm" title="Marcar como no leído">
                  <MailOpen className="h-4 w-4" />
                </ActionButton>
                <ActionButton action={deleteConversation} fields={{ id: active.id }} className="btn-ghost btn-sm text-red-600" confirm="¿Eliminar esta conversación y todos sus mensajes?" title="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </ActionButton>
              </header>
              <div className="max-h-[60vh] flex-1 space-y-4 overflow-y-auto bg-slate-50/50 px-6 py-6">
                {thread.map(({ m, a }) => {
                  const mine = m.direction === "saliente";
                  const note = m.direction === "interno";
                  return (
                    <div key={m.id} className={clsx("flex", mine || note ? "justify-end" : "justify-start")}>
                      <div className={clsx("max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm", note ? "border border-amber-200 bg-amber-50" : mine ? "bg-brand-600 text-white" : "bg-white")}>
                        <p className={clsx("mb-1 text-xs font-medium", mine ? "text-brand-100" : "text-muted")}>
                          {note ? `Nota interna · ${a?.name ?? ""}` : mine ? (a?.name ?? "Agencia") : (m.senderName ?? "Cliente")}
                        </p>
                        <p className="whitespace-pre-line">{m.body}</p>
                        <p className={clsx("mt-1 text-right text-[11px]", mine ? "text-brand-100" : "text-muted")}>{fmtDateTime(m.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <ScrollBottom />
              </div>
              <ReplyBox conversationId={active.id} templates={TEMPLATES} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
