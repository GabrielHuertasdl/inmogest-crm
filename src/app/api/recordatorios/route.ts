import { NextResponse } from "next/server";
import { and, eq, gte, isNotNull, lt, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSession } from "@/lib/auth/session";
import { EVENT_KINDS } from "@/lib/constants";
import { fmtTime } from "@/lib/format";

/** Events whose reminder time falls in the next poll window (used by the in-app notifier). */
export async function GET() {
  const u = await getSession();
  if (!u) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const now = Date.now();
  const rows = db
    .select()
    .from(schema.events)
    .where(
      and(
        isNotNull(schema.events.reminderMinutes),
        eq(schema.events.done, false),
        gte(schema.events.startsAt, new Date(now - 60_000)),
        lt(schema.events.startsAt, new Date(now + 2 * 86_400_000)),
        or(eq(schema.events.agentId, u.id), eq(schema.events.notifyAll, true)),
      ),
    )
    .all()
    .filter((e) => {
      const at = e.startsAt.getTime() - e.reminderMinutes! * 60_000;
      return at <= now && at > now - 70_000;
    });
  return NextResponse.json({ reminders: rows.map((e) => ({ id: e.id, title: `${EVENT_KINDS[e.kind]}: ${e.title}`, body: `${fmtTime(e.startsAt)}${e.location ? ` · ${e.location}` : ""}` })) });
}
