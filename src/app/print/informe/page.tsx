import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth/guards";
import { PrintHeader } from "@/components/PrintHeader";
import { captacionesByMonth, incomeByMonth, parseRange, quickStats, todayKpis, agentsList } from "@/lib/queries/dashboard";
import { dayKey, euros, fmt } from "@/lib/format";
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const mLabel = (k: string) => MONTHS[Number(k.slice(5, 7)) - 1];

export const metadata = { title: "Informe de actividad" };

export default async function PrintReport({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const r = parseRange(sp, u.id);
  const agentId = u.role === "admin" ? r.agentId : u.id;
  const range = { ...r, agentId };
  const inc = incomeByMonth(range);
  const cap = captacionesByMonth(range);
  const qs = quickStats(agentId);
  const k = todayKpis(agentId);
  const agentName = agentId ? agentsList().find((a) => a.id === agentId)?.name : "Todos los agentes";
  const agency = db.select().from(schema.agency).get();
  return (
    <article className="space-y-6 p-10 text-sm">
      <PrintHeader agency={agency} title="INFORME DE ACTIVIDAD" subtitle={`${fmt(r.from)} – ${fmt(new Date(r.to.getTime() - 1))} · ${agentName}`} />
      <section className="grid grid-cols-4 gap-3">
        {[
          ["Disponibles", qs.disponibles],
          ["Reservadas", qs.reservadas],
          ["Cerradas", qs.cerradas],
          ["Clientes", qs.clientes],
          ["Captaciones en curso", qs.captacionesAbiertas],
          ["Captaciones periodo", cap.total],
          ["Operaciones periodo", inc.operaciones],
          ["Facturas emitidas", inc.facturas],
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-line p-3">
            <p className="text-xs text-muted">{l}</p>
            <p className="text-xl font-bold">{v}</p>
          </div>
        ))}
      </section>
      <section>
        <p className="mb-2 font-semibold">Agenda de hoy ({dayKey(new Date())})</p>
        <p>
          Llamadas {k.llamada.done}/{k.llamada.total} · Reuniones {k.reunion.done}/{k.reunion.total} · Visitas {k.visita.done}/{k.visita.total} · Firmas {k.firma.done}/{k.firma.total}
        </p>
      </section>
      <section>
        <p className="mb-2 font-semibold">Ingresos y captaciones por mes</p>
        <table className="w-full">
          <thead>
            <tr className="border-y border-line text-left text-xs text-muted uppercase">
              <th className="py-2">Mes</th>
              <th className="py-2 text-right">Captaciones</th>
              <th className="py-2 text-right">Estimado operaciones</th>
              <th className="py-2 text-right">Facturado</th>
            </tr>
          </thead>
          <tbody>
            {inc.data.map((d, i) => (
              <tr key={d.month} className="border-b border-line">
                <td className="py-1.5">{mLabel(d.month)} {d.month.slice(0, 4)}</td>
                <td className="py-1.5 text-right">{cap.data[i]?.total as number}</td>
                <td className="py-1.5 text-right">{euros(d.estimado)}</td>
                <td className="py-1.5 text-right">{euros(d.facturado)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-2">Total</td>
              <td className="py-2 text-right">{cap.total}</td>
              <td className="py-2 text-right">{euros(inc.totalEstimado)}</td>
              <td className="py-2 text-right">{euros(inc.totalFacturado)}</td>
            </tr>
          </tbody>
        </table>
      </section>
      {cap.perAgent.length > 1 && (
        <section>
          <p className="mb-2 font-semibold">Captaciones por agente</p>
          <ul>
            {cap.perAgent.map((a) => (
              <li key={a.id} className="flex justify-between border-b border-line py-1.5">
                <span>{a.name}</span>
                <b>{a.total}</b>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
