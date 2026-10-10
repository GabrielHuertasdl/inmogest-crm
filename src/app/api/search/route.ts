import { NextResponse } from "next/server";
import { like, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSession } from "@/lib/auth/session";
import { euros } from "@/lib/format";
import { OPERATIONS, PROPERTY_TYPES, LEAD_STAGES } from "@/lib/constants";

export async function GET(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ hits: [] });
  const p = `%${q}%`;
  const props = db
    .select()
    .from(schema.properties)
    .where(or(like(schema.properties.ref, p), like(schema.properties.title, p), like(schema.properties.address, p), like(schema.properties.city, p), like(schema.properties.zone, p)))
    .limit(6)
    .all();
  const clients = db
    .select()
    .from(schema.clients)
    .where(
      or(
        like(sql`${schema.clients.name} || ' ' || coalesce(${schema.clients.surname}, '')`, p),
        like(schema.clients.email, p),
        like(schema.clients.phone, p),
        like(schema.clients.dni, p),
      ),
    )
    .limit(6)
    .all();
  const leads = db
    .select()
    .from(schema.leads)
    .where(or(like(schema.leads.ownerName, p), like(schema.leads.address, p), like(schema.leads.phone, p)))
    .limit(4)
    .all();
  return NextResponse.json({
    hits: [
      ...props.map((x) => ({
        kind: "Propiedades",
        id: x.id,
        title: `${x.ref} · ${x.title}`,
        sub: `${PROPERTY_TYPES[x.type] ?? x.type} en ${OPERATIONS[x.operation]?.toLowerCase()} · ${[x.zone, x.city].filter(Boolean).join(", ")} · ${euros(x.price)}`,
        href: `/propiedades/${x.id}`,
      })),
      ...clients.map((c) => ({ kind: "Clientes", id: c.id, title: [c.name, c.surname].filter(Boolean).join(" "), sub: [c.email, c.phone].filter(Boolean).join(" · "), href: `/clientes/${c.id}` })),
      ...leads.map((l) => ({ kind: "Captaciones", id: l.id, title: l.ownerName, sub: `${LEAD_STAGES[l.stage]} · ${[l.address, l.city].filter(Boolean).join(", ")}`, href: `/captaciones/${l.id}` })),
    ],
  });
}
