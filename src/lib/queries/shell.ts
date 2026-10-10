import "server-only";
import { and, count, eq, gte, isNull, lt, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { dayBounds, todayKey } from "@/lib/format";
import type { SessionUser } from "@/lib/auth/session";

export function shellCounts(u: SessionUser) {
  const unread =
    db
      .select({ n: count() })
      .from(schema.messages)
      .innerJoin(schema.conversations, eq(schema.conversations.id, schema.messages.conversationId))
      .where(
        and(
          isNull(schema.messages.readAt),
          eq(schema.messages.direction, "entrante"),
          u.role === "admin" ? undefined : or(eq(schema.conversations.agentId, u.id), isNull(schema.conversations.agentId)),
        ),
      )
      .get()?.n ?? 0;
  const { start, end } = dayBounds(todayKey());
  const todayEvents =
    db
      .select({ n: count() })
      .from(schema.events)
      .where(and(gte(schema.events.startsAt, start), lt(schema.events.startsAt, end), eq(schema.events.done, false), u.role === "admin" ? undefined : eq(schema.events.agentId, u.id)))
      .get()?.n ?? 0;
  return { unread, todayEvents };
}
