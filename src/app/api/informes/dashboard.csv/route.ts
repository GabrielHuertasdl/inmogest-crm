import { getSession } from "@/lib/auth/session";
import { captacionesByMonth, incomeByMonth, parseRange } from "@/lib/queries/dashboard";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET(req: Request) {
  const u = await getSession();
  if (!u) return new Response("No autenticado", { status: 401 });
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const r = parseRange(sp, u.id);
  const range = { ...r, agentId: u.role === "admin" ? r.agentId : u.id };
  const inc = incomeByMonth(range);
  const cap = captacionesByMonth(range);
  const rows = inc.data.map((d, i) => [d.month, cap.data[i]?.total as number, d.estimado, d.facturado]);
  rows.push(["TOTAL", cap.total, inc.totalEstimado, inc.totalFacturado]);
  return csvResponse("informe-inmogest.csv", toCsv(["Mes", "Captaciones", "Estimado operaciones (€)", "Facturado (€)"], rows));
}
