import { and, inArray, isNotNull, eq } from "drizzle-orm";
import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui";
import { MapView } from "@/components/maps";
import { db, schema } from "@/db";
import { coversFor } from "@/lib/queries/properties";
import { OPERATIONS, PROPERTY_STATUS, PROPERTY_TYPES } from "@/lib/constants";
import { euros } from "@/lib/format";

export const metadata = { title: "Mapa de propiedades" };

const COLOR: Record<string, string> = { disponible: "#16a34a", reservado: "#d97706", vendido: "#3463e6", alquilado: "#7c3aed", retirado: "#64748b", borrador: "#64748b" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export default async function MapaPage({ searchParams }: { searchParams: Promise<{ status?: string; operation?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const statuses = sp.status === "todas" ? Object.keys(PROPERTY_STATUS) : ["disponible", "reservado"];
  const rows = db
    .select()
    .from(schema.properties)
    .where(and(isNotNull(schema.properties.lat), inArray(schema.properties.status, statuses), sp.operation ? eq(schema.properties.operation, sp.operation) : undefined))
    .all();
  const covers = coversFor(rows.map((r) => r.id));
  const ag = db.select().from(schema.agency).get();
  const pins = rows.map((p) => ({
    id: p.id,
    lat: p.lat!,
    lng: p.lng!,
    color: COLOR[p.status],
    html: `<a href="/propiedades/${p.id}" style="display:block;width:200px;color:inherit;text-decoration:none">${covers[p.id] ? `<img src="/files/${esc(covers[p.id]!)}" style="width:100%;height:110px;object-fit:cover;border-radius:8px"/>` : ""}<b style="display:block;margin-top:6px">${euros(p.price)}</b><span style="font-size:12px">${esc(p.ref)} · ${esc(PROPERTY_TYPES[p.type] ?? p.type)} · ${esc(OPERATIONS[p.operation] ?? "")}</span><br/><span style="font-size:12px;color:#64748b">${esc(p.title)}</span></a>`,
  }));
  const link = (patch: Record<string, string | undefined>) => `/propiedades/mapa?${new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]).toString()}`;
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Mapa de propiedades"
        subtitle={`${rows.length} inmuebles con ubicación`}
        back="/propiedades"
        actions={
          <div className="flex flex-wrap gap-1 text-sm">
            <Link href={link({ status: undefined })} className={`rounded-lg px-3 py-2 ${sp.status !== "todas" ? "bg-brand-600 text-white" : "bg-white"}`}>Activas</Link>
            <Link href={link({ status: "todas" })} className={`rounded-lg px-3 py-2 ${sp.status === "todas" ? "bg-brand-600 text-white" : "bg-white"}`}>Todas</Link>
            <span className="mx-2" />
            {[["", "Venta y alquiler"], ["venta", "Venta"], ["alquiler", "Alquiler"]].map(([k, l]) => (
              <Link key={k} href={link({ operation: k || undefined })} className={`rounded-lg px-3 py-2 ${(sp.operation ?? "") === k ? "bg-brand-600 text-white" : "bg-white"}`}>
                {l}
              </Link>
            ))}
          </div>
        }
      />
      <div className="card p-3">
        <MapView center={[ag?.lat ?? 40.4168, ag?.lng ?? -3.7038]} zoom={11} pins={pins} height="calc(100dvh - 260px)" fit />
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        {Object.entries(COLOR).slice(0, 4).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: c }} /> {PROPERTY_STATUS[k]}
          </span>
        ))}
      </div>
    </div>
  );
}
