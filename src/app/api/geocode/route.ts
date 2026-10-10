import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/** Address → coordinates via OpenStreetMap Nominatim (1 req/s policy; used interactively only). */
export async function GET(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 200);
  if (!q) return NextResponse.json({});
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=es&q=${encodeURIComponent(q)}`, {
      headers: { "user-agent": "Inmogest-CRM/1.0 (self-hosted)", "accept-language": "es" },
      signal: AbortSignal.timeout(8000),
    });
    const d = (await r.json()) as { lat: string; lon: string }[];
    if (!d[0]) return NextResponse.json({});
    return NextResponse.json({ lat: Number(d[0].lat), lng: Number(d[0].lon) });
  } catch {
    return NextResponse.json({});
  }
}
