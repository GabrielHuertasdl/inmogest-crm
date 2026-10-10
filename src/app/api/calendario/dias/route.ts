import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { monthEventDays } from "@/lib/queries/dashboard";

export async function GET(req: Request) {
  const u = await getSession();
  if (!u) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const y = Number(sp.get("y")), m = Number(sp.get("m"));
  if (!y || !m || m < 1 || m > 12) return NextResponse.json({ days: {} });
  const a = sp.get("agent");
  const agentId = a === "all" || !a ? (u.role === "admin" ? null : u.id) : Number(a) || null;
  return NextResponse.json({ days: monthEventDays(y, m, agentId) });
}
