import "server-only";
import { redirect, forbidden } from "next/navigation";
import { getSession, type SessionUser } from "./session";

export async function requireUser(): Promise<SessionUser> {
  const u = await getSession();
  if (!u) redirect("/login");
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "admin") forbidden();
  return u;
}

export const isAdmin = (u: SessionUser) => u.role === "admin";
export const can = (u: SessionUser, perm: string) => u.role === "admin" || u.perms.includes(perm);

/** Agents may edit their own records, unassigned ones, or all with "editar_todo". */
export function canEdit(u: SessionUser, rec: { agentId: number | null }) {
  return u.role === "admin" || can(u, "editar_todo") || rec.agentId == null || rec.agentId === u.id;
}

export class ActionError extends Error {}
export function assertCanEdit(u: SessionUser, rec: { agentId: number | null } | undefined | null) {
  if (!rec) throw new ActionError("Registro no encontrado");
  if (!canEdit(u, rec)) throw new ActionError("No tienes permiso para modificar este registro");
}
