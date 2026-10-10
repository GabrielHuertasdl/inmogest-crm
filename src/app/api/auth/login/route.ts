import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

/** JSON login (used for scripted checks and API clients). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const u = email ? db.select().from(schema.users).where(eq(schema.users.email, email)).get() : undefined;
  if (!u || !u.active || !verifyPassword(String(body.password ?? ""), u.passwordHash)) return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  await createSession(u.id);
  return NextResponse.json({ ok: true, user: { id: u.id, name: u.name, role: u.role } });
}
