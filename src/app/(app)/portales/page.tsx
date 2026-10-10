import { headers } from "next/headers";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { Globe2, RefreshCw } from "lucide-react";
import { requireUser, canEdit } from "@/lib/auth/guards";
import { Badge, Card, PageHeader } from "@/components/ui";
import { ActionButton, CopyButton } from "@/components/forms";
import { PortalMatrix } from "@/components/PortalMatrix";
import { db, schema } from "@/db";
import { PORTALS } from "@/lib/constants";
import { euros, fmtDateTime } from "@/lib/format";
import { regenerateToken, togglePortalEnabled } from "./actions";

export const metadata = { title: "Portales inmobiliarios" };

export default async function PortalsPage() {
  const u = await requireUser();
  const isAdmin = u.role === "admin";
  const h = await headers();
  const base = process.env.APP_URL?.replace(/\/$/, "") || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const portals = db.select().from(schema.portals).orderBy(asc(schema.portals.id)).all();
  const counts = Object.fromEntries(
    db
      .select({ portalId: schema.propertyPortals.portalId, n: count() })
      .from(schema.propertyPortals)
      .innerJoin(schema.properties, eq(schema.properties.id, schema.propertyPortals.propertyId))
      .where(inArray(schema.properties.status, ["disponible", "reservado"]))
      .groupBy(schema.propertyPortals.portalId)
      .all()
      .map((r) => [r.portalId, r.n]),
  );
  const props = db
    .select()
    .from(schema.properties)
    .where(and(inArray(schema.properties.status, ["disponible", "reservado"])))
    .orderBy(asc(schema.properties.ref))
    .all();
  const links = db.select().from(schema.propertyPortals).all();
  const enabled = portals.filter((p) => p.enabled);
  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader title="Portales inmobiliarios" subtitle="Publica tus inmuebles en los principales portales desde un solo lugar" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {portals.map((p) => {
          const def = PORTALS.find((d) => d.key === p.key);
          const url = `${base}/feeds/${p.key}.xml?token=${p.feedToken}`;
          return (
            <div key={p.id} className={`card p-5 ${!p.enabled ? "opacity-70" : ""}`}>
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: def?.color ?? "#64748b" }}>
                  <Globe2 className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted">{def?.format === "kyero" ? "Formato Kyero v3" : "Formato XML genérico"}</p>
                </div>
                {isAdmin ? (
                  <ActionButton action={togglePortalEnabled} fields={{ id: p.id }} className={`relative h-6 w-11 rounded-full transition ${p.enabled ? "bg-emerald-500" : "bg-slate-300"}`} title={p.enabled ? "Desactivar" : "Activar"}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${p.enabled ? "left-[22px]" : "left-0.5"}`} />
                  </ActionButton>
                ) : (
                  <Badge tone={p.enabled ? "green" : "gray"}>{p.enabled ? "Activo" : "Inactivo"}</Badge>
                )}
              </div>
              <p className="text-sm">
                <span className="text-2xl font-bold">{counts[p.id] ?? 0}</span> <span className="text-muted">inmuebles publicados</span>
              </p>
              {p.enabled && isAdmin && (
                <div className="mt-4 space-y-2 border-t border-line pt-3">
                  <p className="text-xs text-muted">URL de exportación (facilítala al portal):</p>
                  <code className="block truncate rounded bg-slate-50 px-2 py-1 text-[11px]" title={url}>
                    {url}
                  </code>
                  <div className="flex flex-wrap gap-2">
                    <CopyButton text={url} label="Copiar URL" />
                    <a href={url} target="_blank" className="btn-ghost btn-sm">
                      Ver XML
                    </a>
                    <ActionButton action={regenerateToken} fields={{ id: p.id }} className="btn-ghost btn-sm" confirm="Se invalidará la URL actual y tendrás que facilitar la nueva al portal. ¿Continuar?" title="Regenerar token">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </ActionButton>
                  </div>
                  <p className="text-[11px] text-muted">Última lectura: {fmtDateTime(p.lastGeneratedAt)}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Card title="Publicación por inmueble" subtitle="Marca en qué portales se publica cada inmueble disponible o reservado.">
        {enabled.length === 0 ? (
          <p className="text-sm text-muted">Activa al menos un portal para publicar inmuebles.</p>
        ) : (
          <PortalMatrix
            portals={enabled.map((p) => ({ id: p.id, name: p.name }))}
            rows={props.map((p) => ({ id: p.id, ref: p.ref, title: p.title, price: euros(p.price), status: p.status, on: links.filter((l) => l.propertyId === p.id).map((l) => l.portalId), editable: canEdit(u, p) }))}
          />
        )}
      </Card>
      <p className="mt-4 text-xs text-muted">
        Nota: los portales leen periódicamente la URL de exportación de tu agencia. Para activar la carga automática, solicita al portal la integración por XML e indícales la URL. La publicación efectiva depende del contrato con cada portal.
      </p>
    </div>
  );
}
