"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";

type S = { error?: string } | null;

export async function login(_: S, fd: FormData): Promise<S> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!email || !password) return { error: "Introduce tu email y contraseña" };
  const u = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  if (!u || !verifyPassword(password, u.passwordHash)) return { error: "Email o contraseña incorrectos" };
  if (!u.active) return { error: "Tu usuario está desactivado. Contacta con el administrador." };
  await createSession(u.id);
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
