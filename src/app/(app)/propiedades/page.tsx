import Link from "next/link";
import { House, LayoutGrid, List, Map as MapIcon, Plus, Download } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { Badge, EmptyState, PageHeader, Pagination, Avatar } from "@/components/ui";
import { FilterBar } from "@/components/FilterBar";
import { PropertyCard, PropertyThumb } from "@/components/PropertyCard";
import { listProperties, propertySummary, distinctCities, agentOptions, type PropFilters } from "@/lib/queries/properties";
import { FEATURES, OPERATIONS, PORTALS, PROPERTY_STATUS, PROPERTY_TYPES, STATUS_TONE, toOptions } from "@/lib/constants";
import { euros, fmt } from "@/lib/format";

export const metadata = { title: "Propiedades" };

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<PropFilters & { view?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const view = sp.view === "grid" ? "grid" : "list";
  const { rows, total, page, pages } = listProperties(sp, view === "grid" ? 24 : 20);
  const s = propertySummary();
  const cities = distinctCities();
  const agents = agentOptions(false);
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/propiedades?${p.toString()}`;
  };
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Propiedades"
        subtitle={`${total} ${total === 1 ? "inmueble" : "inmuebles"} encontrados`}
        actions={
          <>
            <a href={`/api/export/propiedades.csv?${new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString()}`} className="btn-secondary">
              <Download className="h-4 w-4" /> Exportar
            </a>
            <Link href="/propiedades/mapa" className="btn-secondary">
              <MapIcon className="h-4 w-4" /> Mapa
            </Link>
            <Link href="/propiedades/nueva" className="btn-primary">
              <Plus className="h-4 w-4" /> Añadir propiedad
            </Link>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total", s.total, "/propiedades"],
          ["Disponibles", s.disponibles, "/propiedades?status=disponible"],
          ["Reservadas", s.reservadas, "/propiedades?status=reservado"],
          ["Cerradas este mes", s.cerradasMes, "/propiedades?status=cerradas"],
          ["Precio medio venta", euros(s.mediaVenta), "/propiedades?operation=venta&status=activas"],
        ].map(([label, value, href]) => (
          <Link key={label as string} href={href as string} className="card p-4 transition hover:shadow-md">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 text-xl font-bold">{value}</p>
          </Link>
        ))}
      </div>

      <FilterBar
        searchPlaceholder="Referencia, título, dirección, zona…"
        filters={[
          { name: "operation", label: "Operación", options: toOptions(OPERATIONS) },
          { name: "type", label: "Tipo", options: toOptions(PROPERTY_TYPES) },
          { name: "status", label: "Estado", options: [...toOptions(PROPERTY_STATUS), { value: "activas", label: "Activas (disp. + reserv.)" }, { value: "cerradas", label: "Cerradas (vend. + alq.)" }] },
          { name: "city", label: "Población", options: cities.map((c) => ({ value: c, label: c })) },
          { name: "zone", label: "Zona", type: "text", placeholder: "Barrio" },
          { name: "agent", label: "Agente", options: agents.map((a) => ({ value: String(a.value), label: a.label })) },
          { name: "minPrice", label: "Precio mín.", type: "number" },
          { name: "maxPrice", label: "Precio máx.", type: "number" },
          { name: "rooms", label: "Habitaciones mín.", type: "number" },
          { name: "baths", label: "Baños mín.", type: "number" },
          { name: "minArea", label: "m² mín.", type: "number" },
          { name: "feature", label: "Extra", options: toOptions(FEATURES) },
          { name: "portal", label: "Publicada en", options: PORTALS.map((p) => ({ value: p.key, label: p.name })) },
          { name: "shared", label: "Compartida", options: [{ value: "1", label: "Sí" }] },
        ]}
        extra={
          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-lg border border-line p-0.5">
              <Link href={qs({ view: "list", page: undefined })} className={`rounded-md p-2 ${view === "list" ? "bg-brand-50 text-brand-700" : "text-slate-500"}`} aria-label="Lista">
                <List className="h-4 w-4" />
              </Link>
              <Link href={qs({ view: "grid", page: undefined })} className={`rounded-md p-2 ${view === "grid" ? "bg-brand-50 text-brand-700" : "text-slate-500"}`} aria-label="Cuadrícula">
                <LayoutGrid className="h-4 w-4" />
              </Link>
            </div>
          </div>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Ordenar:</span>
        {[
          ["recientes", "Más recientes"],
          ["precio_asc", "Precio ↑"],
          ["precio_desc", "Precio ↓"],
          ["ref", "Referencia"],
          ["antiguos", "Más antiguas"],
        ].map(([k, l]) => (
          <Link key={k} href={qs({ sort: k, page: undefined })} className={`rounded-full px-3 py-1 ${(sp.sort ?? "recientes") === k ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>
            {l}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={House} title="No hay propiedades" text="Prueba a cambiar los filtros o añade tu primer inmueble." action={<Link href="/propiedades/nueva" className="btn-primary">Añadir propiedad</Link>} />
      ) : view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {rows.map((p) => (
            <PropertyCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Inmueble</th>
                <th>Operación</th>
                <th>Precio</th>
                <th>Características</th>
                <th>Estado</th>
                <th>Agente</th>
                <th>Alta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/propiedades/${p.id}`} className="flex items-center gap-3">
                      <PropertyThumb src={p.cover} alt={p.title} className="h-14 w-20 shrink-0 rounded-lg" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-brand-600">{p.ref}</p>
                        <p className="max-w-72 truncate font-medium">{p.title}</p>
                        <p className="truncate text-xs text-muted">{[p.address, p.zone, p.city].filter(Boolean).join(", ")}</p>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <p>{OPERATIONS[p.operation]}</p>
                    <p className="text-xs text-muted">{PROPERTY_TYPES[p.type]}</p>
                  </td>
                  <td className="font-semibold whitespace-nowrap">
                    {euros(p.price)}
                    {p.operation === "alquiler" && <span className="text-xs font-normal text-muted">/mes</span>}
                  </td>
                  <td className="text-xs whitespace-nowrap text-slate-600">
                    {[p.areaBuilt && `${p.areaBuilt} m²`, p.rooms != null && `${p.rooms} hab.`, p.baths != null && `${p.baths} baños`].filter(Boolean).join(" · ")}
                  </td>
                  <td>
                    <div className="flex flex-col items-start gap-1">
                      <Badge tone={STATUS_TONE[p.status]}>{PROPERTY_STATUS[p.status]}</Badge>
                      {p.isShared && <Badge tone="violet">Compartida</Badge>}
                    </div>
                  </td>
                  <td>
                    {p.agentName && (
                      <span className="flex items-center gap-2 text-xs">
                        <Avatar name={p.agentName} color={p.agentColor ?? undefined} size={26} /> {p.agentName.split(" ")[0]}
                      </span>
                    )}
                  </td>
                  <td className="text-xs whitespace-nowrap text-muted">{fmt(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} href={(n) => qs({ page: String(n) })} />
    </div>
  );
}
