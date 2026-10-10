"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/guards";
import { fail, type ActionState } from "@/lib/actions";

export async function togglePortalEnabled(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const id = Number(fd.get("id"));
    const p = db.select().from(schema.portals).where(eq(schema.portals.id, id)).get();
    if (p) db.update(schema.portals).set({ enabled: !p.enabled }).where(eq(schema.portals.id, id)).run();
    revalidatePath("/portales");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function regenerateToken(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    db.update(schema.portals).set({ feedToken: randomBytes(12).toString("hex") }).where(eq(schema.portals.id, Number(fd.get("id")))).run();
    revalidatePath("/portales");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
