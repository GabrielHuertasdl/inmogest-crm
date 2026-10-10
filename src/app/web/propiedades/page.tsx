import Link from "next/link";
import { List, Map as MapIcon } from "lucide-react";
import { publicAgency, publicCities, publicList, type PublicFilters } from "@/lib/queries/public";
import { PublicCard } from "@/components/web/PublicCard";
import { SearchBox } from "@/components/web/SearchBox";
import { MapView } from "@/components/maps";
import { euros } from "@/lib/format";

export const metadata = { title: "Propiedades" };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export default async function WebList({ searchParams }: { searchParams: Promise<PublicFilters & { view?: string }> }) {
  const sp = await searchParams;
  const view = sp.view === "mapa" ? "mapa" : "lista";
  const { rows, total, page, pages } = publicList(sp, view === "mapa" ? 500 : 12);
  const a = publicAgency();
  const link = (patch: Record<string, string | undefined>) => `/web/propiedades?${new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]).toString()}`;
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold text-slate-900">{sp.operation === "venta" ? "Inmuebles en venta" : sp.operation === "alquiler" ? "Inmuebles en alquiler" : "Todos los inmuebles"}</h1>
      <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <SearchBox cities={publicCities()} values={sp} inline />
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-slate-500">{total} resultados</span>
        <span className="ml-auto text-slate-500">Ordenar:</span>
        {[
          ["", "Recientes"],
          ["precio_asc", "Precio ↑"],
          ["precio_desc", "Precio ↓"],
        ].map(([k, l]) => (
          <Link key={k} href={link({ sort: k || undefined, page: undefined })} className={`rounded-full px-3 py-1 ${(sp.sort ?? "") === k ? "bg-[var(--brand)] text-white" : "bg-white ring-1 ring-slate-200"}`}>
            {l}
          </Link>
        ))}
        <div className="flex rounded-lg bg-white p-0.5 ring-1 ring-slate-200">
          <Link href={link({ view: undefined })} className={`flex items-center gap-1 rounded-md px-3 py-1.5 ${view === "lista" ? "bg-[var(--brand)] text-white" : ""}`}>
            <List className="h-4 w-4" /> Lista
          </Link>
          <Link href={link({ view: "mapa", page: undefined })} className={`flex items-center gap-1 rounded-md px-3 py-1.5 ${view === "mapa" ? "bg-[var(--brand)] text-white" : ""}`}>
            <MapIcon className="h-4 w-4" /> Mapa
          </Link>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-2xl bg-white py-16 text-center text-slate-500">No hay inmuebles con estos criterios. Prueba a ampliar la búsqueda.</p>
      ) : view === "mapa" ? (
        <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-sm">
          <MapView
            center={[a.lat ?? 40.4168, a.lng ?? -3.7038]}
            zoom={11}
            fit
            height="70vh"
            pins={rows
              .filter((p) => p.lat != null)
              .map((p) => ({
                id: p.id,
                lat: p.lat!,
                lng: p.lng!,
                color: a.primaryColor,
                html: `<a href="/web/propiedades/${esc(p.ref)}" style="display:block;width:210px;color:inherit;text-decoration:none">${p.cover ? `<img src="/files/${esc(p.cover)}" style="width:100%;height:120px;object-fit:cover;border-radius:8px"/>` : ""}<b style="display:block;margin-top:6px;font-size:15px">${euros(p.price)}${p.operation === "alquiler" ? "/mes" : ""}</b><span style="font-size:12px">${esc(p.title)}</span></a>`,
              }))}
          />
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((p) => (
              <PublicCard key={p.id} p={p} />
            ))}
          </div>
          {pages > 1 && (
            <nav className="mt-10 flex justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={link({ page: String(n) })} className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-medium ${n === page ? "bg-[var(--brand)] text-white" : "bg-white ring-1 ring-slate-200"}`}>
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
