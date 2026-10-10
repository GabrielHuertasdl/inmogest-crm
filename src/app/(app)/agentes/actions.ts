"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin, requireUser, ActionError } from "@/lib/auth/guards";
import { fail, parse, zs, type ActionState } from "@/lib/actions";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { saveImage, removeUpload } from "@/lib/uploads";
import { PERMISSIONS } from "@/lib/constants";

const AgentSchema = z.object({
  id: zs.id,
  name: zs.req("El nombre es obligatorio"),
  email: z.email("Email no válido"),
  phone: zs.str,
  role: z.enum(["admin", "agente"]).default("agente"),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).default("#3463e6"),
  active: zs.bool,
  password: z.string().min(8, "Mínimo 8 caracteres").optional(),
  permissions: zs.arr,
});

export async function saveAgent(_: ActionState, fd: FormData): Promise<ActionState> {
  let id: number;
  try {
    const me = await requireAdmin();
    const p = parse(AgentSchema, fd);
    if ("state" in p) return p.state;
    const d = p.data;
    if (!d.id && !d.password) return { ok: false, error: "Indica una contraseña inicial", fieldErrors: { password: ["Obligatoria"] } };
    if (d.id === me.id && (d.role !== "admin" || !d.active)) throw new ActionError("No puedes quitarte el rol de administrador ni desactivarte a ti mismo");
    const values = {
      name: d.name,
      email: d.email.toLowerCase(),
      phone: d.phone ?? null,
      role: d.role,
      color: d.color,
      active: d.id ? d.active : true,
      permissions: JSON.stringify(d.permissions.filter((x) => x in PERMISSIONS)),
      ...(d.password ? { passwordHash: hashPassword(d.password) } : {}),
    };
    if (d.id) {
      db.update(schema.users).set(values).where(eq(schema.users.id, d.id)).run();
      if (!d.active || d.password) db.delete(schema.sessions).where(and(eq(schema.sessions.userId, d.id), d.id === me.id ? ne(schema.sessions.userId, me.id) : undefined)).run();
      id = d.id;
    } else id = db.insert(schema.users).values({ ...values, passwordHash: values.passwordHash! }).returning({ id: schema.users.id }).get().id;
    revalidatePath("/", "layout");
  } catch (e) {
    return fail(e);
  }
  redirect(`/agentes/${id}`);
}

const ProfileSchema = z.object({ name: zs.req("El nombre es obligatorio"), phone: zs.str, color: z.string().regex(/^#[0-9a-f]{6}$/i).default("#3463e6") });

export async function updateProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const p = parse(ProfileSchema, fd);
    if ("state" in p) return p.state;
    const avatar = fd.get("avatar");
    let avatarPath: string | undefined;
    if (avatar instanceof File && avatar.size > 0) {
      avatarPath = await saveImage(avatar, `avatars/${u.id}`);
      removeUpload(u.avatarPath);
    }
    db.update(schema.users)
      .set({ name: p.data.name, phone: p.data.phone ?? null, color: p.data.color, ...(avatarPath ? { avatarPath } : {}), ...(fd.get("removeAvatar") === "on" ? { avatarPath: null } : {}) })
      .where(eq(schema.users.id, u.id))
      .run();
    revalidatePath("/", "layout");
    return { ok: true, message: "Perfil actualizado" };
  } catch (e) {
    if (e instanceof Error && /no es una imagen|supera/.test(e.message)) return { ok: false, error: e.message };
    return fail(e);
  }
}

export async function changePassword(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    const current = String(fd.get("current") ?? "");
    const next = String(fd.get("next") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    const row = db.select().from(schema.users).where(eq(schema.users.id, u.id)).get()!;
    if (!verifyPassword(current, row.passwordHash)) return { ok: false, error: "La contraseña actual no es correcta", fieldErrors: { current: ["Incorrecta"] } };
    if (next.length < 8) return { ok: false, error: "La nueva contraseña debe tener al menos 8 caracteres", fieldErrors: { next: ["Mínimo 8 caracteres"] } };
    if (next !== confirm) return { ok: false, error: "Las contraseñas no coinciden", fieldErrors: { confirm: ["No coincide"] } };
    db.update(schema.users).set({ passwordHash: hashPassword(next) }).where(eq(schema.users.id, u.id)).run();
    return { ok: true, message: "Contraseña cambiada" };
  } catch (e) {
    return fail(e);
  }
}
