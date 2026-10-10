import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Pencil, Trash2, Phone, Mail, MessageCircle, CalendarPlus, Check, X, Star, FilePlus2, ClipboardSignature } from "lucide-react";
import { requireUser, canEdit } from "@/lib/auth/guards";
import { Avatar, Badge, Card, DL, EmptyState, PageHeader, ScoreRing, Tabs } from "@/components/ui";
import { ActionButton } from "@/components/forms";
import { InterestButtons } from "@/components/InterestButtons";
import { PropertyThumb } from "@/components/PropertyCard";
import { getClient } from "@/lib/queries/clients";
import { coversFor } from "@/lib/queries/properties";
import { matchPropertiesForClient, interestMap } from "@/lib/matching";
import { db, schema } from "@/db";
import { CLIENT_KINDS, CLIENT_SOURCES, CLIENT_STATUS, CLIENT_STATUS_TONE, EVENT_COLORS, EVENT_KINDS, FEATURES, INTEREST_LEVELS, INVOICE_STATUS, INVOICE_STATUS_TONE, OPERATIONS, PROPERTY_STATUS, PROPERTY_TYPES, STATUS_TONE } from "@/lib/constants";
import { cents, euros, fmt, fmtDateTime, parseJsonArray } from "@/lib/format";
import { deleteClient } from "../actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const r = getClient(Number((await params).id));
  return { title: r ? `${r.c.name} ${r.c.surname ?? ""}` : "Cliente" };
}

export default async function ClientDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const u = await requireUser();
  const id = Number((await params).id);
  const { tab = "datos" } = await searchParams;
  const row = getClient(id);
  if (!row) notFound();
  const { c, pref, agent } = row;
  const editable = canEdit(u, c);
  const { matches } = matchPropertiesForClient(id);
  const covers = coversFor(matches.map((m) => m.property.id));
  const interests = interestMap({ clientId: id });
  const owned = db.select().from(schema.properties).where(eq(schema.properties.ownerClientId, id)).all();
  const events = db.select().from(schema.events).where(eq(schema.events.clientId, id)).orderBy(desc(schema.events.startsAt)).all();
  const convs = db.select().from(schema.conversations).where(eq(schema.conversations.clientId, id)).orderBy(desc(schema.conversations.lastMessageAt)).all();
  const visits = db
    .select({ v: schema.visitReports, p: schema.properties })
    .from(schema.visitReports)
    .innerJoin(schema.properties, eq(schema.properties.id, schema.visitReports.propertyId))
    .where(eq(schema.visitReports.clientId, id))
    .orderBy(desc(schema.visitReports.visitedAt))
    .all();
  const invoices = db.select().from(schema.invoices).where(eq(schema.invoices.clientId, id)).orderBy(desc(schema.invoices.issueDate)).all();
  const interested = db
    .select({ i: schema.clientPropertyInterest, p: schema.properties })
    .from(schema.clientPropertyInterest)
    .innerJoin(schema.properties, eq(schema.properties.id, schema.clientPropertyInterest.propertyId))
    .where(eq(schema.clientPropertyInterest.clientId, id))
    .all();
  const full = `${c.name} ${c.surname ?? ""}`.trim();
  const base = `/clientes/${id}`;
  const tel = c.phone?.replace(/\s/g, "");

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        back="/clientes"
        title={
          <span className="flex items-center gap-3">
            <Avatar name={full} size={44} color="#64748b" /> {full}
          </span>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge>{CLIENT_KINDS[c.kind]}</Badge>
            <Badge tone={CLIENT_STATUS_TONE[c.status]}>{CLIENT_STATUS[c.status]}</Badge>
            <span>Alta {fmt(c.createdAt)} · {CLIENT_SOURCES[c.source]}</span>
          </span>
        }
        actions={
          <>
            {tel && (
              <>
                <a href={`tel:${tel}`} className="btn-secondary">
                  <Phone className="h-4 w-4" /> Llamar
                </a>
                <a href={`https://wa.me/34${tel.replace(/^\+?34/, "")}`} target="_blank" rel="noreferrer" className="btn-secondary">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} className="btn-secondary">
                <Mail className="h-4 w-4" /> Email
              </a>
            )}
            {editable && (
              <>
                <Link href={`${base}/editar`} className="btn-primary">
                  <Pencil className="h-4 w-4" /> Editar
                </Link>
                <ActionButton action={deleteClient} fields={{ id }} className="btn-ghost text-red-600" confirm={`¿Eliminar a ${full}? Se perderán sus preferencias y su historial de cruces.`} title="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </ActionButton>
              </>
            )}
          </>
        }
      />

      <Tabs
        base={base}
        active={tab}
        tabs={[
          { key: "datos", label: "Datos" },
          { key: "cruces", label: "Cruces", count: matches.length },
          { key: "agenda", label: "Agenda", count: events.length },
          { key: "mensajes", label: "Mensajes", count: convs.length },
          { key: "visitas", label: "Visitas", count: visits.length },
          { key: "facturas", label: "Facturas", count: invoices.length },
        ]}
      />

      {tab === "datos" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Card title="Datos de contacto">
              <DL
                cols={3}
                items={[
                  ["Teléfono", c.phone],
                  ["Teléfono 2", c.phone2],
                  ["Email", c.email],
                  ["DNI / NIE", c.dni],
                  ["Dirección", c.address],
                  ["RGPD", c.gdprConsent ? "Aceptado" : "Pendiente"],
                ]}
              />
              {c.notes && <p className="mt-6 rounded-xl bg-amber-50/60 p-4 text-sm whitespace-pre-line text-slate-700">{c.notes}</p>}
            </Card>
            <Card title="Demanda" actions={editable && <Link href={`${base}/editar`} className="btn-ghost btn-sm">Editar</Link>}>
              {pref ? (
                <>
                  <DL
                    cols={4}
                    items={[
                      ["Estado", pref.active ? <Badge key="a" tone="green">Activa</Badge> : <Badge key="a">Inactiva</Badge>],
                      ["Operación", pref.operation ? OPERATIONS[pref.operation] : "Cualquiera"],
                      ["Presupuesto", `${pref.minPrice ? euros(pref.minPrice) : "0 €"} – ${pref.maxPrice ? euros(pref.maxPrice) : "sin límite"}`],
                      ["Tipos", parseJsonArray(pref.types).map((t) => PROPERTY_TYPES[t]).join(", ") || "Cualquiera"],
                      ["Habitaciones", pref.minRooms ? `${pref.minRooms} o más` : "—"],
                      ["Baños", pref.minBaths ? `${pref.minBaths} o más` : "—"],
                      ["Superficie", pref.minArea ? `${pref.minArea} m² o más` : "—"],
                      ["Zonas", parseJsonArray(pref.zones).join(", ") || "Cualquiera"],
                    ]}
                  />
                  {parseJsonArray(pref.features).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {parseJsonArray(pref.features).map((f) => (
                        <Badge key={f} tone="blue">{FEATURES[f]}</Badge>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted">Este cliente no tiene demanda registrada.</p>
              )}
            </Card>
            {owned.length > 0 && (
              <Card title="Propiedades de este cliente">
                <ul className="divide-y divide-line">
                  {owned.map((p) => (
                    <li key={p.id}>
                      <Link href={`/propiedades/${p.id}`} className="flex items-center justify-between py-3 text-sm hover:opacity-80">
                        <span>
                          <span className="font-semibold text-brand-600">{p.ref}</span> · {p.title}
                        </span>
                        <Badge tone={STATUS_TONE[p.status]}>{PROPERTY_STATUS[p.status]}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
          <div className="space-y-6">
            <Card title="Agente">
              {agent ? (
                <div className="flex items-center gap-3">
                  <Avatar name={agent.name} color={agent.color} size={40} />
                  <div className="text-sm">
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-muted">{agent.phone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted">Sin asignar</p>
              )}
            </Card>
            <Card title="Acciones rápidas">
              <div className="grid gap-2">
                <Link href={`/calendario?new=1&kind=llamada&clientId=${id}`} className="btn-secondary justify-start">
                  <CalendarPlus className="h-4 w-4" /> Programar llamada / visita
                </Link>
                <Link href={`/partes-visita/nuevo?clientId=${id}`} className="btn-secondary justify-start">
                  <ClipboardSignature className="h-4 w-4" /> Nuevo parte de visita
                </Link>
                <Link href={`/facturas/nueva?clientId=${id}`} className="btn-secondary justify-start">
                  <FilePlus2 className="h-4 w-4" /> Nueva factura
                </Link>
                <Link href={`${base}?tab=cruces`} className="btn-secondary justify-start">
                  <Star className="h-4 w-4" /> {matches.length} propiedades compatibles
                </Link>
              </div>
            </Card>
            <Card title="Propiedades marcadas">
              {interested.length === 0 ? (
                <p className="text-sm text-muted">Ninguna todavía.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {interested.map(({ i, p }) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <Link href={`/propiedades/${p.id}`} className="truncate hover:text-brand-600">
                        {p.ref} · {p.title}
                      </Link>
                      <Badge tone={i.status === "interesado" ? "green" : i.status === "descartado" ? "gray" : i.status === "visitado" ? "violet" : "blue"}>{i.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === "cruces" && (
        <Card title="Propiedades compatibles" subtitle="Inmuebles disponibles que encajan con la demanda del cliente, ordenados por afinidad.">
          {!pref?.active ? (
            <EmptyState title="Demanda inactiva" text="Activa y completa la demanda del cliente para ver cruces." action={editable && <Link href={`${base}/editar`} className="btn-primary">Editar demanda</Link>} />
          ) : matches.length === 0 ? (
            <EmptyState title="Sin propiedades compatibles" text="No hay inmuebles disponibles que cumplan los criterios." />
          ) : (
            <div className="space-y-3">
              {matches.map(({ property: p, m }) => (
                <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-line p-3">
                  <ScoreRing value={m.score} />
                  <PropertyThumb src={covers[p.id] ?? null} alt={p.title} className="h-16 w-24 rounded-lg" />
                  <div className="min-w-48 flex-1">
                    <Link href={`/propiedades/${p.id}`} className="font-medium hover:text-brand-600">
                      <span className="text-brand-600">{p.ref}</span> · {p.title}
                    </Link>
                    <p className="text-xs text-muted">
                      {euros(p.price)} · {[p.areaBuilt && `${p.areaBuilt} m²`, p.rooms != null && `${p.rooms} hab.`, p.zone].filter(Boolean).join(" · ")}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      {m.reasons.slice(0, 5).map((r, i) => (
                        <span key={i} className={`inline-flex items-center gap-1 text-xs ${r.ok ? "text-emerald-700" : "text-red-600"}`}>
                          {r.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          {r.text}
                        </span>
                      ))}
                    </div>
                  </div>
                  <InterestButtons clientId={id} propertyId={p.id} status={interests[`${id}:${p.id}`]} />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "agenda" && (
        <Card title="Agenda del cliente" actions={<Link href={`/calendario?new=1&clientId=${id}`} className="btn-primary btn-sm">+ Evento</Link>}>
          {events.length === 0 ? (
            <EmptyState title="Sin eventos" />
          ) : (
            <ul className="space-y-3">
              {events.map((e) => (
                <li key={e.id} className="flex items-start gap-3 rounded-xl border border-line p-3">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: EVENT_COLORS[e.kind] }} />
                  <div className="flex-1 text-sm">
                    <p className={`font-medium ${e.done ? "text-muted line-through" : ""}`}>
                      {EVENT_KINDS[e.kind]}: {e.title}
                    </p>
                    <p className="text-xs text-muted">
                      {fmtDateTime(e.startsAt)}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                  </div>
                  {e.done && <Badge tone="green">Hecho</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "mensajes" && (
        <Card title="Conversaciones" actions={<Link href={`/mensajes?nuevo=1&clientId=${id}`} className="btn-primary btn-sm">+ Mensaje</Link>}>
          {convs.length === 0 ? (
            <EmptyState title="Sin mensajes" />
          ) : (
            <ul className="divide-y divide-line">
              {convs.map((cv) => (
                <li key={cv.id}>
                  <Link href={`/mensajes?c=${cv.id}`} className="flex items-center justify-between py-3 text-sm hover:opacity-80">
                    <span className="font-medium">{cv.subject}</span>
                    <span className="text-xs text-muted">{fmtDateTime(cv.lastMessageAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "visitas" && (
        <Card title="Partes de visita" actions={<Link href={`/partes-visita/nuevo?clientId=${id}`} className="btn-primary btn-sm">+ Nuevo parte</Link>}>
          {visits.length === 0 ? (
            <EmptyState title="Sin visitas" />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Propiedad</th>
                  <th>Interés</th>
                  <th>Oferta</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visits.map(({ v, p }) => (
                  <tr key={v.id}>
                    <td>{fmtDateTime(v.visitedAt)}</td>
                    <td>
                      <Link href={`/propiedades/${p.id}`} className="hover:text-brand-600">
                        {p.ref} · {p.title}
                      </Link>
                    </td>
                    <td>{INTEREST_LEVELS[v.interestLevel]}</td>
                    <td>{v.offerAmount ? euros(v.offerAmount) : "—"}</td>
                    <td>
                      <Link href={`/print/parte-visita/${v.id}`} target="_blank" className="text-brand-600 hover:underline">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "facturas" && (
        <Card title="Facturas" actions={<Link href={`/facturas/nueva?clientId=${id}`} className="btn-primary btn-sm">+ Factura</Link>}>
          {invoices.length === 0 ? (
            <EmptyState title="Sin facturas" />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <Link href={`/facturas/${i.id}`} className="font-medium text-brand-600 hover:underline">
                        {i.number ?? "Borrador"}
                      </Link>
                    </td>
                    <td>{fmt(i.issueDate)}</td>
                    <td className="font-semibold">{cents(i.totalCents)}</td>
                    <td>
                      <Badge tone={INVOICE_STATUS_TONE[i.status]}>{INVOICE_STATUS[i.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
