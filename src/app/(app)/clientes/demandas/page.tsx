import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/auth/guards";
import { Badge, Card, PageHeader } from "@/components/ui";
import { db, schema } from "@/db";
import { matchPropertiesForClient } from "@/lib/matching";
import { CLIENT_KINDS, OPERATIONS, PROPERTY_TYPES } from "@/lib/constants";
import { euros, parseJsonArray } from "@/lib/format";
import { SimpleBars } from "@/components/charts";

export const metadata = { title: "Demandas" };

export default async function DemandasPage({ searchParams }: { searchParams: Promise<{ op?: string }> }) {
  await requireUser();
  const { op } = await searchParams;
  const rows = db
    .select({ c: schema.clients, p: schema.clientPreferences })
    .from(schema.clientPreferences)
    .innerJoin(schema.clients, eq(schema.clients.id, schema.clientPreferences.clientId))
    .where(and(eq(schema.clientPreferences.active, true), inArray(schema.clients.status, ["nuevo", "activo", "en_negociacion"]), op ? eq(schema.clientPreferences.operation, op) : undefined))
    .all();
  const withMatches = rows.map((r) => ({ ...r, n: matchPropertiesForClient(r.c.id).matches.length })).sort((a, b) => b.n - a.n);

  const zoneCount: Record<string, number> = {};
  const typeCount: Record<string, number> = {};
  const budget = { "< 150k": 0, "150–250k": 0, "250–400k": 0, "> 400k": 0 };
  for (const r of rows) {
    parseJsonArray(r.p.zones).forEach((z) => (zoneCount[z] = (zoneCount[z] ?? 0) + 1));
    parseJsonArray(r.p.types).forEach((t) => (typeCount[t] = (typeCount[t] ?? 0) + 1));
    if (r.p.operation === "venta" && r.p.maxPrice) {
      const m = r.p.maxPrice;
      budget[m < 150000 ? "< 150k" : m < 250000 ? "150–250k" : m < 400000 ? "250–400k" : "> 400k"]++;
    }
  }
  const topZones = Object.entries(zoneCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Demandas"
        subtitle={`${rows.length} demandas activas · qué buscan tus clientes`}
        actions={
          <div className="flex gap-1">
            {[["", "Todas"], ["venta", "Compra"], ["alquiler", "Alquiler"]].map(([k, l]) => (
              <Link key={k} href={k ? `/clientes/demandas?op=${k}` : "/clientes/demandas"} className={`rounded-lg px-3 py-2 text-sm ${(op ?? "") === k ? "bg-brand-600 text-white" : "bg-white text-slate-600"}`}>
                {l}
              </Link>
            ))}
          </div>
        }
      />
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card title="Zonas más buscadas">
          <SimpleBars data={topZones} />
        </Card>
        <Card title="Presupuesto (compra)">
          <SimpleBars data={Object.entries(budget).map(([label, value]) => ({ label, value }))} color="#16a34a" />
        </Card>
        <Card title="Tipos solicitados">
          <ul className="space-y-2 text-sm">
            {Object.entries(typeCount)
              .sort((a, b) => b[1] - a[1])
              .map(([t, n]) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="w-20">{PROPERTY_TYPES[t]}</span>
                  <span className="h-2 flex-1 rounded-full bg-slate-100">
                    <span className="block h-2 rounded-full bg-brand-500" style={{ width: `${(n / rows.length) * 100}%` }} />
                  </span>
                  <span className="w-6 text-right font-medium">{n}</span>
                </li>
              ))}
            {Object.keys(typeCount).length === 0 && <li className="text-muted">Sin datos</li>}
          </ul>
        </Card>
      </div>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Busca</th>
              <th>Presupuesto</th>
              <th>Requisitos</th>
              <th>Zonas</th>
              <th>Cruces</th>
            </tr>
          </thead>
          <tbody>
            {withMatches.map(({ c, p, n }) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/clientes/${c.id}`} className="font-medium hover:text-brand-600">
                    {c.name} {c.surname}
                  </Link>
                  <p className="text-xs text-muted">{CLIENT_KINDS[c.kind]}</p>
                </td>
                <td>
                  {p.operation ? OPERATIONS[p.operation] : "Cualquiera"}
                  <p className="text-xs text-muted">{parseJsonArray(p.types).map((t) => PROPERTY_TYPES[t]).join(", ") || "Cualquier tipo"}</p>
                </td>
                <td className="whitespace-nowrap">{p.maxPrice ? `hasta ${euros(p.maxPrice)}` : "—"}</td>
                <td className="text-xs">{[p.minRooms && `${p.minRooms}+ hab.`, p.minBaths && `${p.minBaths}+ baños`, p.minArea && `${p.minArea}+ m²`].filter(Boolean).join(" · ") || "—"}</td>
                <td className="max-w-48 truncate text-xs">{parseJsonArray(p.zones).join(", ") || "—"}</td>
                <td>
                  <Link href={`/clientes/${c.id}?tab=cruces`}>
                    <Badge tone={n ? "green" : "gray"}>{n} propiedades</Badge>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
