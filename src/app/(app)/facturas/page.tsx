import Link from "next/link";
import { and, desc, eq, gte, like, lt, or } from "drizzle-orm";
import { forbidden } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { requireUser, can } from "@/lib/auth/guards";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { db, schema } from "@/db";
import { INVOICE_STATUS, INVOICE_STATUS_TONE } from "@/lib/constants";
import { cents, fmt, fromMadrid, madridParts } from "@/lib/format";

export const metadata = { title: "Mis facturas" };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string; year?: string; q?: string }> }) {
  const u = await requireUser();
  if (!can(u, "ver_facturas")) forbidden();
  const sp = await searchParams;
  const nowY = madridParts(new Date()).y;
  const year = Number(sp.year) || nowY;
  const I = schema.invoices;
  const rows = db
    .select()
    .from(I)
    .where(
      and(
        gte(I.issueDate, fromMadrid(year, 1, 1)),
        lt(I.issueDate, fromMadrid(year + 1, 1, 1)),
        sp.status ? eq(I.status, sp.status) : undefined,
        sp.q ? or(like(I.number, `%${sp.q}%`), like(I.customerName, `%${sp.q}%`), like(I.customerNif, `%${sp.q}%`)) : undefined,
        u.role === "admin" ? undefined : eq(I.agentId, u.id),
      ),
    )
    .orderBy(desc(I.issueDate), desc(I.id))
    .all();
  const valid = rows.filter((r) => r.status === "emitida" || r.status === "pagada");
  const sum = (f: (r: (typeof rows)[number]) => boolean, k: "totalCents" | "subtotalCents" | "vatCents" = "totalCents") => rows.filter(f).reduce((s, r) => s + r[k], 0);
  const link = (patch: Record<string, string | undefined>) => `/facturas?${new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]).toString()}`;
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Mis facturas"
        subtitle={`Ejercicio ${year}`}
        actions={
          <>
            <a href={`/api/export/facturas.csv?year=${year}`} className="btn-secondary">
              Exportar
            </a>
            <Link href="/facturas/nueva" className="btn-primary">
              <Plus className="h-4 w-4" /> Nueva factura
            </Link>
          </>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-muted">Facturado (base)</p>
          <p className="mt-1 text-xl font-bold">{cents(valid.reduce((s, r) => s + r.subtotalCents, 0))}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">IVA repercutido</p>
          <p className="mt-1 text-xl font-bold">{cents(valid.reduce((s, r) => s + r.vatCents, 0))}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Cobrado</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">{cents(sum((r) => r.status === "pagada"))}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Pendiente de cobro</p>
          <p className="mt-1 text-xl font-bold text-amber-600">{cents(sum((r) => r.status === "emitida"))}</p>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        {[nowY - 2, nowY - 1, nowY].map((y) => (
          <Link key={y} href={link({ year: String(y) })} className={`rounded-lg px-3 py-2 ${year === y ? "bg-slate-800 text-white" : "bg-white"}`}>
            {y}
          </Link>
        ))}
        <span className="mx-2" />
        <Link href={link({ status: undefined })} className={`rounded-lg px-3 py-2 ${!sp.status ? "bg-brand-600 text-white" : "bg-white"}`}>
          Todas
        </Link>
        {Object.entries(INVOICE_STATUS).map(([k, l]) => (
          <Link key={k} href={link({ status: k })} className={`rounded-lg px-3 py-2 ${sp.status === k ? "bg-brand-600 text-white" : "bg-white"}`}>
            {l}
          </Link>
        ))}
        <form className="ml-auto" action="/facturas">
          <input type="hidden" name="year" value={year} />
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Número, cliente, NIF…" className="input h-9 w-56" />
        </form>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={FileText} title="No hay facturas" action={<Link href="/facturas/nueva" className="btn-primary">Nueva factura</Link>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th className="text-right">Base</th>
                <th className="text-right">IVA</th>
                <th className="text-right">Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/facturas/${r.id}`} className="font-semibold text-brand-600 hover:underline">
                      {r.number ?? "Borrador"}
                    </Link>
                  </td>
                  <td>{fmt(r.issueDate)}</td>
                  <td>
                    {r.customerName}
                    <p className="text-xs text-muted">{r.customerNif}</p>
                  </td>
                  <td className="text-right">{cents(r.subtotalCents)}</td>
                  <td className="text-right text-muted">{cents(r.vatCents)}</td>
                  <td className="text-right font-semibold">{cents(r.totalCents)}</td>
                  <td>
                    <Badge tone={INVOICE_STATUS_TONE[r.status]}>{INVOICE_STATUS[r.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
