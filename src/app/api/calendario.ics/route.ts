import { and, eq, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSession } from "@/lib/auth/session";
import { buildIcs } from "@/lib/ics";
import { EVENT_KINDS } from "@/lib/constants";

export async function GET(req: Request) {
  const u = await getSession();
  if (!u) return new Response("No autenticado", { status: 401 });
  const a = new URL(req.url).searchParams.get("agent");
  const agentId = u.role !== "admin" ? u.id : a && a !== "all" ? Number(a) : null;
  const since = new Date(Date.now() - 90 * 86400000);
  const rows = db
    .select({ e: schema.events, c: schema.clients, p: schema.properties })
    .from(schema.events)
    .leftJoin(schema.clients, eq(schema.clients.id, schema.events.clientId))
    .leftJoin(schema.properties, eq(schema.properties.id, schema.events.propertyId))
    .where(and(gte(schema.events.startsAt, since), agentId ? eq(schema.events.agentId, agentId) : undefined))
    .all();
  const ics = buildIcs(
    rows.map(({ e, c, p }) => ({ ...e, clientName: c ? `${c.name} ${c.surname ?? ""}`.trim() : null, propertyRef: p ? `${p.ref} ${p.title}` : null })),
    "Inmogest",
    EVENT_KINDS,
  );
  return new Response(ics, { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": 'attachment; filename="inmogest.ics"' } });
}
