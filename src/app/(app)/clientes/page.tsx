import Link from "next/link";
import { Users, Plus, Download } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { Avatar, Badge, EmptyState, PageHeader, Pagination } from "@/components/ui";
import { FilterBar } from "@/components/FilterBar";
import { listClients, clientSummary, type ClientFilters } from "@/lib/queries/clients";
import { agentOptions } from "@/lib/queries/properties";
import { CLIENT_KINDS, CLIENT_SOURCES, CLIENT_STATUS, CLIENT_STATUS_TONE, OPERATIONS, toOptions } from "@/lib/constants";
import { euros, fmt, parseJsonArray } from "@/lib/format";

export const metadata = { title: "Clientes" };

export default async function ClientsPage({ searchParams }: { searchParams: Promise<ClientFilters> }) {
  await requireUser();
  const sp = await searchParams;
  const { rows, total, page, pages } = listClients(sp);
  const s = clientSummary();
  const qs = (patch: Record<string, string | undefined>) => `/clientes?${new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]).toString()}`;
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Clientes"
        subtitle={`${total} ${total === 1 ? "cliente" : "clientes"}`}
        actions={
          <>
            <a href={`/api/export/clientes.csv?${new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString()}`} className="btn-secondary">
              <Download className="h-4 w-4" /> Exportar
            </a>
            <Link href="/clientes/nuevo" className="btn-primary">
              <Plus className="h-4 w-4" /> Añadir cliente
            </Link>
          </>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total", s.total, "/clientes"],
          ["Activos", s.activos, "/clientes?status=activo"],
          ["Compradores", s.compradores, "/clientes?kind=comprador"],
          ["Inquilinos", s.inquilinos, "/clientes?kind=inquilino"],
          ["Propietarios", s.propietarios, "/clientes?kind=propietario"],
        ].map(([l, n, h]) => (
          <Link key={l as string} href={h as string} className="card p-4 transition hover:shadow-md">
            <p className="text-xs text-muted">{l}</p>
            <p className="mt-1 text-xl font-bold">{n}</p>
          </Link>
        ))}
      </div>
      <FilterBar
        searchPlaceholder="Nombre, email, teléfono, DNI…"
        filters={[
          { name: "kind", label: "Tipo", options: toOptions(CLIENT_KINDS) },
          { name: "status", label: "Estado", options: toOptions(CLIENT_STATUS) },
          { name: "source", label: "Origen", options: toOptions(CLIENT_SOURCES) },
          { name: "agent", label: "Agente", options: agentOptions(false).map((a) => ({ value: String(a.value), label: a.label })) },
          { name: "operation", label: "Busca", options: toOptions(OPERATIONS) },
          { name: "maxBudget", label: "Presupuesto ≥ (€)", type: "number" },
          { name: "zone", label: "Zona de interés", type: "text" },
        ]}
      />
      {rows.length === 0 ? (
        <EmptyState icon={Users} title="No hay clientes" action={<Link href="/clientes/nuevo" className="btn-primary">Añadir cliente</Link>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Tipo</th>
                <th>Demanda</th>
                <th>Estado</th>
                <th>Agente</th>
                <th>Alta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, pref, agentName, agentColor }) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/clientes/${c.id}`} className="flex items-center gap-3">
                      <Avatar name={`${c.name} ${c.surname ?? ""}`} size={36} color="#64748b" />
                      <span className="font-medium hover:text-brand-600">
                        {c.name} {c.surname}
                      </span>
                    </Link>
                  </td>
                  <td className="text-xs">
                    <p>{c.phone}</p>
                    <p className="text-muted">{c.email}</p>
                  </td>
                  <td>
                    <Badge>{CLIENT_KINDS[c.kind]}</Badge>
                    <p className="mt-1 text-xs text-muted">{CLIENT_SOURCES[c.source]}</p>
                  </td>
                  <td className="text-xs">
                    {pref?.active ? (
                      <>
                        <p>
                          {pref.operation ? OPERATIONS[pref.operation] : "Cualquiera"}
                          {pref.maxPrice ? ` · hasta ${euros(pref.maxPrice)}` : ""}
                        </p>
                        <p className="max-w-56 truncate text-muted">
                          {[pref.minRooms && `${pref.minRooms}+ hab.`, parseJsonArray(pref.zones).join(", ")].filter(Boolean).join(" · ")}
                        </p>
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <Badge tone={CLIENT_STATUS_TONE[c.status]}>{CLIENT_STATUS[c.status]}</Badge>
                  </td>
                  <td>{agentName && <span className="flex items-center gap-2 text-xs"><Avatar name={agentName} color={agentColor ?? undefined} size={24} /> {agentName.split(" ")[0]}</span>}</td>
                  <td className="text-xs text-muted">{fmt(c.createdAt)}</td>
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
