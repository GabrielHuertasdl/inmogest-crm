import { NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";

const Body = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(1).max(4000),
  propertyRef: z.string().trim().max(20).optional(),
  website: z.string().optional(), // honeypot
  consent: z.union([z.boolean(), z.literal("on")]).optional(),
});

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 8;
}

/** Public contact form: find-or-create client, open a web conversation with an unread incoming message. */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return NextResponse.json({ error: "Demasiadas solicitudes. Inténtalo más tarde." }, { status: 429 });
  const ct = req.headers.get("content-type") ?? "";
  const raw = ct.includes("application/json") ? await req.json().catch(() => ({})) : Object.fromEntries((await req.formData()).entries());
  const r = Body.safeParse(raw);
  if (!r.success) return NextResponse.json({ error: "Revisa los datos del formulario" }, { status: 400 });
  const d = r.data;
  if (d.website) return NextResponse.json({ ok: true }); // bot
  if (!d.email && !d.phone) return NextResponse.json({ error: "Indica un email o teléfono" }, { status: 400 });

  const prop = d.propertyRef ? db.select().from(schema.properties).where(eq(schema.properties.ref, d.propertyRef)).get() : undefined;
  const email = d.email ? d.email.toLowerCase() : null;
  const now = new Date();
  db.transaction((tx) => {
    let client = tx
      .select()
      .from(schema.clients)
      .where(or(email ? eq(schema.clients.email, email) : undefined, d.phone ? eq(schema.clients.phone, d.phone) : undefined))
      .get();
    if (!client) {
      const [name, ...rest] = d.name.split(" ");
      client = tx
        .insert(schema.clients)
        .values({ name: name!, surname: rest.join(" ") || null, email, phone: d.phone ?? null, kind: prop?.operation === "alquiler" ? "inquilino" : "comprador", source: "web", status: "nuevo", agentId: prop?.agentId ?? null, gdprConsent: !!d.consent })
        .returning()
        .get();
    }
    const conv = tx
      .insert(schema.conversations)
      .values({ clientId: client.id, subject: prop ? `Consulta sobre ${prop.ref} · ${prop.title}` : "Consulta desde la web", channel: "web", propertyId: prop?.id ?? null, agentId: prop?.agentId ?? client.agentId ?? null, lastMessageAt: now })
      .returning()
      .get();
    tx.insert(schema.messages).values({ conversationId: conv.id, direction: "entrante", body: d.message, senderName: d.name, senderEmail: email, senderPhone: d.phone ?? null, createdAt: now }).run();
    if (prop) tx.insert(schema.clientPropertyInterest).values({ clientId: client.id, propertyId: prop.id, status: "interesado" }).onConflictDoNothing().run();
  });
  return NextResponse.json({ ok: true });
}
