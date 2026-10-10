import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { User } from "@/db/schema";

export const SESSION_COOKIE = "ig_session";
const DAY = 86_400_000;
const TTL = 30 * DAY;

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL);
  db.insert(schema.sessions).values({ id: hashToken(token), userId, expiresAt }).run();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) db.delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token))).run();
  jar.delete(SESSION_COOKIE);
}

export type SessionUser = Omit<User, "passwordHash"> & { perms: string[] };

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const id = hashToken(token);
  const row = db
    .select({ s: schema.sessions, u: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(eq(schema.sessions.id, id))
    .get();
  if (!row) return null;
  if (row.s.expiresAt.getTime() < Date.now() || !row.u.active) {
    db.delete(schema.sessions).where(eq(schema.sessions.id, id)).run();
    return null;
  }
  if (row.s.expiresAt.getTime() - Date.now() < 15 * DAY) {
    db.update(schema.sessions).set({ expiresAt: new Date(Date.now() + TTL) }).where(eq(schema.sessions.id, id)).run();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...u } = row.u;
  let perms: string[] = [];
  try {
    perms = JSON.parse(u.permissions);
  } catch {}
  return { ...u, perms };
});
