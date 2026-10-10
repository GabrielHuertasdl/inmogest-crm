import { eq } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import { db, schema } from "@/db";
import { PORTALS } from "@/lib/constants";
import { genericFeed, kyeroFeed } from "@/lib/feeds";

export async function GET(req: Request, { params }: { params: Promise<{ portal: string }> }) {
  const key = (await params).portal.replace(/\.xml$/, "");
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const portal = db.select().from(schema.portals).where(eq(schema.portals.key, key)).get();
  const def = PORTALS.find((p) => p.key === key);
  const ok = portal && def && portal.enabled && token.length === portal.feedToken.length && timingSafeEqual(Buffer.from(token), Buffer.from(portal.feedToken));
  if (!ok) return new Response("Not found", { status: 404 });
  const ag = db.select().from(schema.agency).get();
  const base = process.env.APP_URL?.replace(/\/$/, "") || new URL(req.url).origin;
  const { xml } = def.format === "kyero" ? kyeroFeed(base, ag?.name ?? "Agencia", portal.id) : genericFeed(base, { name: ag?.name ?? "Agencia", email: ag?.email ?? null, phone: ag?.phone ?? null }, portal.id);
  db.update(schema.portals).set({ lastGeneratedAt: new Date() }).where(eq(schema.portals.id, portal.id)).run();
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "no-store" } });
}
