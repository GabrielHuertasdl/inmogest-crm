import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, or } from "drizzle-orm";
import { Pencil, Copy, Trash2, Printer, MapPin, BedDouble, Bath, Ruler, Star, Share2, Globe2, ArrowUp, ArrowDown, ImagePlus, Check, X, CalendarPlus, ClipboardSignature, ExternalLink } from "lucide-react";
import { requireUser, canEdit } from "@/lib/auth/guards";
import { Badge, Card, DL, EmptyState, PageHeader, Tabs, Avatar, ScoreRing } from "@/components/ui";
import { ActionButton, ActionForm, SubmitButton } from "@/components/forms";
import { MapView } from "@/components/maps";
import { StatusChanger } from "@/components/StatusChanger";
import { InterestButtons } from "@/components/InterestButtons";
import { getProperty, allPortals } from "@/lib/queries/properties";
import { matchClientsForProperty, interestMap } from "@/lib/matching";
import { db, schema } from "@/db";
import { CONDITIONS, EVENT_KINDS, EVENT_COLORS, FEATURES, INTEREST_LEVELS, INTEREST_STATUS, OPERATIONS, PROPERTY_STATUS, PROPERTY_TYPES, STATUS_TONE, CLIENT_KINDS } from "@/lib/constants";
import { euros, fmt, fmtDateTime, m2 } from "@/lib/format";
import { deletePhoto, deleteProperty, duplicateProperty, movePhoto, setCover, togglePortal, uploadPhotos } from "../actions";
import { commissionOf } from "@/lib/queries/dashboard";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = getProperty(Number((await params).id));
  return { title: p ? `${p.ref} · ${p.title}` : "Propiedad" };
}

export default async function PropertyDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const u = await requireUser();
  const id = Number((await params).id);
  const { tab = "resumen" } = await searchParams;
  const p = getProperty(id);
  if (!p) notFound();
  const editable = canEdit(u, p);
  const portals = allPortals();
  const matches = matchClientsForProperty(id);
  const interests = interestMap({ propertyId: id });
  const visits = db
    .select({ v: schema.visitReports, c: schema.clients })
    .from(schema.visitReports)
    .innerJoin(schema.clients, eq(schema.clients.id, schema.visitReports.clientId))
    .where(eq(schema.visitReports.propertyId, id))
    .orderBy(desc(schema.visitReports.visitedAt))
    .all();
  const events = db
    .select({ e: schema.events, c: schema.clients })
    .from(schema.events)
    .leftJoin(schema.clients, eq(schema.clients.id, schema.events.clientId))
    .where(eq(schema.events.propertyId, id))
    .orderBy(desc(schema.events.startsAt))
    .all();
  const convs = db.select().from(schema.conversations).where(eq(schema.conversations.propertyId, id)).orderBy(desc(schema.conversations.lastMessageAt)).all();
  const cover = p.photos[0];
  const base = `/propiedades/${id}`;
  const ppm = p.areaBuilt ? Math.round(p.price / p.areaBuilt) : null;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        back="/propiedades"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {p.title}
            {p.featured && <Star className="h-5 w-5 fill-amber-400 text-amber-400" />}
          </span>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-brand-600">{p.ref}</span> · {PROPERTY_TYPES[p.type]} en {OPERATIONS[p.operation]?.toLowerCase()} · <MapPin className="h-3.5 w-3.5" />
            {[p.address, p.zone, p.city].filter(Boolean).join(", ")}
          </span>
        }
        actions={
          <>
            <Link href={`/print/propiedad/${id}`} target="_blank" className="btn-secondary">
              <Printer className="h-4 w-4" /> Ficha
            </Link>
            {p.publishedWeb && (p.status === "disponible" || p.status === "reservado") && (
              <Link href={`/web/propiedades/${p.ref}`} target="_blank" className="btn-secondary">
                <ExternalLink className="h-4 w-4" /> Ver en web
              </Link>
            )}
            <ActionButton action={duplicateProperty} fields={{ id }} className="btn-secondary" title="Duplicar">
              <Copy className="h-4 w-4" /> Duplicar
            </ActionButton>
            {editable && (
              <>
                <Link href={`${base}/editar`} className="btn-primary">
                  <Pencil className="h-4 w-4" /> Editar
                </Link>
                <ActionButton action={deleteProperty} fields={{ id }} className="btn-ghost text-red-600" confirm={`¿Eliminar definitivamente ${p.ref}? Se borrarán sus fotos y su publicación en portales.`} title="Eliminar">
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
          { key: "resumen", label: "Resumen" },
          { key: "fotos", label: "Fotos", count: p.photos.length },
          { key: "mapa", label: "Mapa" },
          { key: "portales", label: "Portales", count: p.portalIds.length },
          { key: "cruces", label: "Cruces", count: matches.length },
          { key: "visitas", label: "Visitas", count: visits.length },
          { key: "actividad", label: "Actividad", count: events.length + convs.length },
        ]}
      />

      {tab === "resumen" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="card overflow-hidden">
              <div className="grid gap-1 sm:grid-cols-[2fr_1fr]">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/files/${cover.path}`} alt={p.title} className="aspect-[4/3] h-full w-full object-cover" />
                ) : (
                  <div className="grid aspect-[4/3] place-items-center bg-slate-100 text-muted">Sin fotos</div>
                )}
                <div className="hidden grid-rows-2 gap-1 sm:grid">
                  {p.photos.slice(1, 3).map((ph) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={ph.id} src={`/files/${ph.path}`} alt="" className="h-full w-full object-cover" />
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6 p-6">
                <div>
                  <p className="text-3xl font-bold">
                    {euros(p.price)}
                    {p.operation === "alquiler" && <span className="text-base font-normal text-muted">/mes</span>}
                  </p>
                  {ppm && <p className="text-sm text-muted">{euros(ppm)}/m²</p>}
                </div>
                <div className="flex flex-wrap gap-5 text-sm text-slate-600">
                  {p.rooms != null && (
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="h-5 w-5 text-brand-600" /> {p.rooms} hab.
                    </span>
                  )}
                  {p.baths != null && (
                    <span className="flex items-center gap-1.5">
                      <Bath className="h-5 w-5 text-brand-600" /> {p.baths} baños
                    </span>
                  )}
                  {p.areaBuilt != null && (
                    <span className="flex items-center gap-1.5">
                      <Ruler className="h-5 w-5 text-brand-600" /> {p.areaBuilt} m²
                    </span>
                  )}
                </div>
                <div className="ml-auto">
                  <StatusChanger id={id} status={p.status} price={p.price} disabled={!editable} />
                </div>
              </div>
            </div>

            <Card title="Descripción">
              {p.description ? <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700">{p.description}</p> : <p className="text-sm text-muted">Sin descripción.</p>}
              {p.descriptionEn && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-brand-600">Descripción en inglés</summary>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-slate-700">{p.descriptionEn}</p>
                </details>
              )}
            </Card>

            <Card title="Características">
              <DL
                cols={4}
                items={[
                  ["Tipo", PROPERTY_TYPES[p.type]],
                  ["Operación", OPERATIONS[p.operation]],
                  ["Sup. construida", m2(p.areaBuilt)],
                  ["Sup. útil", m2(p.areaUseful)],
                  ["Parcela", m2(p.plotArea)],
                  ["Habitaciones", p.rooms ?? "—"],
                  ["Baños", p.baths ?? "—"],
                  ["Planta", p.floor ?? "—"],
                  ["Año construcción", p.yearBuilt ?? "—"],
                  ["Cert. energético", p.energyRating ?? "—"],
                  ["Conservación", CONDITIONS[p.condition]],
                  ["Comunidad", p.communityFee ? `${euros(p.communityFee)}/mes` : "—"],
                ]}
              />
              {p.featureList.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
                  {p.featureList.map((f) => (
                    <Badge key={f} tone="blue">
                      <Check className="h-3 w-3" /> {FEATURES[f] ?? f}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Gestión">
              <div className="space-y-4 text-sm">
                {p.agent && (
                  <div className="flex items-center gap-3">
                    <Avatar name={p.agent.name} color={p.agent.color} size={40} />
                    <div>
                      <p className="font-medium">{p.agent.name}</p>
                      <p className="text-xs text-muted">Agente responsable</p>
                    </div>
                  </div>
                )}
                <DL
                  cols={2}
                  items={[
                    ["Estado", <Badge key="s" tone={STATUS_TONE[p.status]}>{PROPERTY_STATUS[p.status]}</Badge>],
                    ["Honorarios", `${p.commissionPct}%${p.operation === "alquiler" ? " de 1 mes" : ""}`],
                    ["Comisión estimada", euros(commissionOf(p))],
                    ["Alta", fmt(p.createdAt)],
                    ...((p.closedAt ? [["Cierre", `${fmt(p.closedAt)} · ${euros(p.closedPrice)}`]] : []) as [string, string][]),
                  ]}
                />
                <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                  <Badge tone={p.publishedWeb ? "green" : "gray"}>
                    <Globe2 className="h-3 w-3" /> {p.publishedWeb ? "Publicada en web" : "No publicada en web"}
                  </Badge>
                  {p.isShared && (
                    <Badge tone="violet">
                      <Share2 className="h-3 w-3" /> Compartida ({p.sharedCommissionPct}%)
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
            <Card title="Propietario">
              {p.owner ? (
                <Link href={`/clientes/${p.owner.id}`} className="block text-sm hover:opacity-80">
                  <p className="font-medium">
                    {p.owner.name} {p.owner.surname}
                  </p>
                  <p className="text-muted">{[p.owner.phone, p.owner.email].filter(Boolean).join(" · ")}</p>
                </Link>
              ) : (
                <p className="text-sm text-muted">Sin propietario asignado.</p>
              )}
            </Card>
            <Card title="Acciones rápidas">
              <div className="grid gap-2">
                <Link href={`/calendario?new=1&kind=visita&propertyId=${id}`} className="btn-secondary justify-start">
                  <CalendarPlus className="h-4 w-4" /> Programar visita
                </Link>
                <Link href={`/partes-visita/nuevo?propertyId=${id}`} className="btn-secondary justify-start">
                  <ClipboardSignature className="h-4 w-4" /> Nuevo parte de visita
                </Link>
                <Link href={`${base}?tab=cruces`} className="btn-secondary justify-start">
                  <Star className="h-4 w-4" /> Ver {matches.length} clientes compatibles
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "fotos" && (
        <Card title="Fotos" subtitle="La foto marcada como portada se muestra en listados, portales y web.">
          {editable && (
            <ActionForm action={uploadPhotos} className="mb-6" resetOnSuccess refresh>
              <input type="hidden" name="propertyId" value={id} />
              <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed border-line p-4">
                <ImagePlus className="h-6 w-6 text-brand-500" />
                <input type="file" name="photos" multiple accept="image/jpeg,image/png,image/webp" className="text-sm" required />
                <SubmitButton className="btn-primary btn-sm ml-auto" pendingText="Subiendo…">
                  Subir fotos
                </SubmitButton>
              </div>
            </ActionForm>
          )}
          {p.photos.length === 0 ? (
            <EmptyState title="Sin fotos" text="Sube fotos para mostrar este inmueble." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {p.photos.map((ph, i) => (
                <div key={ph.id} className="overflow-hidden rounded-xl border border-line">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/files/${ph.path}`} alt="" className="aspect-[4/3] w-full object-cover" />
                    {ph.isCover && <Badge tone="amber" className="absolute top-2 left-2 bg-white">Portada</Badge>}
                  </div>
                  {editable && (
                    <div className="flex items-center gap-1 p-2">
                      <ActionButton action={movePhoto} fields={{ photoId: ph.id, dir: "up" }} className="btn-ghost btn-sm" title="Mover antes">
                        <ArrowUp className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton action={movePhoto} fields={{ photoId: ph.id, dir: "down" }} className="btn-ghost btn-sm" title="Mover después">
                        <ArrowDown className="h-4 w-4" />
                      </ActionButton>
                      <span className="text-xs text-muted">#{i + 1}</span>
                      {!ph.isCover && (
                        <ActionButton action={setCover} fields={{ photoId: ph.id }} className="btn-ghost btn-sm ml-auto">
                          Portada
                        </ActionButton>
                      )}
                      <ActionButton action={deletePhoto} fields={{ photoId: ph.id }} className={`btn-ghost btn-sm text-red-600 ${ph.isCover ? "ml-auto" : ""}`} confirm="¿Eliminar esta foto?" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </ActionButton>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "mapa" && (
        <Card title="Ubicación" subtitle={[p.address, p.postalCode, p.city, p.province].filter(Boolean).join(", ")}>
          {p.lat != null && p.lng != null ? (
            <MapView center={[p.lat, p.lng]} zoom={16} pins={[{ id: p.id, lat: p.lat, lng: p.lng, label: p.ref }]} height={480} />
          ) : (
            <EmptyState icon={MapPin} title="Sin ubicación" text="Edita la propiedad y sitúala en el mapa." />
          )}
        </Card>
      )}

      {tab === "portales" && (
        <Card title="Publicación en portales" subtitle="Activa o desactiva la publicación en cada portal. Solo se exportan inmuebles disponibles o reservados.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {portals.map((po) => {
              const on = p.portalIds.includes(po.id);
              return (
                <div key={po.id} className={`flex items-center justify-between rounded-xl border p-4 ${on ? "border-brand-200 bg-brand-50/40" : "border-line"} ${!po.enabled ? "opacity-50" : ""}`}>
                  <div>
                    <p className="font-medium">{po.name}</p>
                    <p className="text-xs text-muted">{!po.enabled ? "Portal desactivado" : on ? "Publicada" : "No publicada"}</p>
                  </div>
                  {editable && po.enabled && (
                    <ActionButton action={togglePortal} fields={{ propertyId: id, portalId: po.id }} className={on ? "btn-secondary btn-sm" : "btn-primary btn-sm"}>
                      {on ? "Retirar" : "Publicar"}
                    </ActionButton>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted">
            Configura los portales y obtén las URLs de exportación en <Link href="/portales" className="text-brand-600 hover:underline">Portales inmobiliarios</Link>.
          </p>
        </Card>
      )}

      {tab === "cruces" && (
        <Card title="Cruces" subtitle="Clientes cuya demanda encaja con este inmueble, ordenados por afinidad.">
          {matches.length === 0 ? (
            <EmptyState title="Sin clientes compatibles" text="Ningún cliente activo tiene una demanda que encaje con este inmueble." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Afinidad</th>
                    <th>Cliente</th>
                    <th>Motivos</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map(({ client: c, m }) => (
                    <tr key={c.id}>
                      <td>
                        <ScoreRing value={m.score} />
                      </td>
                      <td>
                        <Link href={`/clientes/${c.id}?tab=cruces`} className="font-medium hover:text-brand-600">
                          {c.name} {c.surname}
                        </Link>
                        <p className="text-xs text-muted">
                          {CLIENT_KINDS[c.kind]} · {c.phone}
                        </p>
                      </td>
                      <td>
                        <div className="flex max-w-md flex-wrap gap-1">
                          {m.reasons.slice(0, 5).map((r, i) => (
                            <span key={i} className={`inline-flex items-center gap-1 text-xs ${r.ok ? "text-emerald-700" : "text-red-600"}`}>
                              {r.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              {r.text}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <InterestButtons clientId={c.id} propertyId={id} status={interests[`${c.id}:${id}`]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "visitas" && (
        <Card title="Partes de visita" actions={<Link href={`/partes-visita/nuevo?propertyId=${id}`} className="btn-primary btn-sm">+ Nuevo parte</Link>}>
          {visits.length === 0 ? (
            <EmptyState title="Sin visitas registradas" />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Interés</th>
                  <th>Valoración</th>
                  <th>Oferta</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visits.map(({ v, c }) => (
                  <tr key={v.id}>
                    <td>{fmtDateTime(v.visitedAt)}</td>
                    <td>
                      {c.name} {c.surname}
                    </td>
                    <td>
                      <Badge tone={v.interestLevel === "alto" ? "green" : v.interestLevel === "medio" ? "amber" : "gray"}>{INTEREST_LEVELS[v.interestLevel]}</Badge>
                    </td>
                    <td>{v.rating ? "★".repeat(v.rating) + "☆".repeat(5 - v.rating) : "—"}</td>
                    <td>{v.offerAmount ? euros(v.offerAmount) : "—"}</td>
                    <td>
                      <Link href={`/print/parte-visita/${v.id}`} target="_blank" className="text-sm text-brand-600 hover:underline">
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

      {tab === "actividad" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Agenda" actions={<Link href={`/calendario?new=1&propertyId=${id}`} className="btn-secondary btn-sm">+ Evento</Link>}>
            {events.length === 0 ? (
              <p className="text-sm text-muted">Sin eventos.</p>
            ) : (
              <ul className="space-y-3">
                {events.map(({ e, c }) => (
                  <li key={e.id} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: EVENT_COLORS[e.kind] }} />
                    <div className="flex-1 text-sm">
                      <p className={`font-medium ${e.done ? "text-muted line-through" : ""}`}>
                        {EVENT_KINDS[e.kind]}: {e.title}
                      </p>
                      <p className="text-xs text-muted">
                        {fmtDateTime(e.startsAt)}
                        {c ? ` · ${c.name} ${c.surname ?? ""}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Consultas">
            {convs.length === 0 ? (
              <p className="text-sm text-muted">Sin consultas.</p>
            ) : (
              <ul className="divide-y divide-line">
                {convs.map((c) => (
                  <li key={c.id}>
                    <Link href={`/mensajes?c=${c.id}`} className="block py-3 text-sm hover:opacity-80">
                      <p className="font-medium">{c.subject}</p>
                      <p className="text-xs text-muted">{fmtDateTime(c.lastMessageAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Interesados" className="lg:col-span-2">
            <InterestedList propertyId={id} />
          </Card>
        </div>
      )}
    </div>
  );
}

function InterestedList({ propertyId }: { propertyId: number }) {
  const rows = db
    .select({ i: schema.clientPropertyInterest, c: schema.clients })
    .from(schema.clientPropertyInterest)
    .innerJoin(schema.clients, eq(schema.clients.id, schema.clientPropertyInterest.clientId))
    .where(and(eq(schema.clientPropertyInterest.propertyId, propertyId), or(eq(schema.clientPropertyInterest.status, "interesado"), eq(schema.clientPropertyInterest.status, "propuesta"), eq(schema.clientPropertyInterest.status, "visitado"))))
    .all();
  if (!rows.length) return <p className="text-sm text-muted">Nadie marcado todavía.</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {rows.map(({ i, c }) => (
        <li key={c.id}>
          <Link href={`/clientes/${c.id}`} className="flex items-center gap-2 rounded-full border border-line py-1 pr-3 pl-1 text-sm hover:bg-slate-50">
            <Avatar name={`${c.name} ${c.surname ?? ""}`} size={24} />
            {c.name} {c.surname?.split(" ")[0]}
            <Badge tone={i.status === "interesado" ? "green" : i.status === "visitado" ? "violet" : "blue"}>{INTEREST_STATUS[i.status]}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
