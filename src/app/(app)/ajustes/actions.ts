"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin, requireUser, can, ActionError } from "@/lib/auth/guards";
import { fail, parse, zs, type ActionState } from "@/lib/actions";
import { saveImage, removeUpload } from "@/lib/uploads";

const url = z.url("URL no válida").max(300).optional();
const hex = z.string().regex(/^#[0-9a-f]{6}$/i, "Color no válido");

const AgencySchema = z.object({
  name: zs.req("El nombre comercial es obligatorio"),
  legalName: zs.str,
  cif: zs.str,
  email: zs.email,
  phone: zs.str,
  address: zs.str,
  city: zs.str,
  province: zs.str,
  postalCode: zs.str,
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  defaultVat: z.coerce.number().min(0).max(100).default(21),
});

export async function saveAgency(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const p = parse(AgencySchema, fd);
    if ("state" in p) return p.state;
    const d = p.data;
    db.update(schema.agency)
      .set({ ...d, legalName: d.legalName ?? null, cif: d.cif ?? null, email: d.email ?? null, phone: d.phone ?? null, address: d.address ?? null, city: d.city ?? null, province: d.province ?? null, postalCode: d.postalCode ?? null, lat: d.lat ?? null, lng: d.lng ?? null, updatedAt: new Date() })
      .where(eq(schema.agency.id, 1))
      .run();
    revalidatePath("/", "layout");
    return { ok: true, message: "Datos de la agencia guardados" };
  } catch (e) {
    return fail(e);
  }
}

const WebSchema = z.object({
  websiteTitle: zs.str,
  websiteTagline: zs.str,
  aboutText: zs.str,
  primaryColor: hex,
  accentColor: hex,
  facebook: url,
  instagram: url,
  linkedin: url,
  x: url,
  showCheapest: zs.bool,
});

export async function saveWebsite(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const u = await requireUser();
    if (!can(u, "web")) throw new ActionError("No tienes permiso para gestionar la web");
    const p = parse(WebSchema, fd);
    if ("state" in p) return p.state;
    const d = p.data;
    const logo = fd.get("logo");
    let logoPath: string | undefined;
    if (logo instanceof File && logo.size > 0) {
      const prev = db.select().from(schema.agency).get();
      logoPath = await saveImage(logo, "agency");
      removeUpload(prev?.logoPath);
    }
    db.update(schema.agency)
      .set({
        websiteTitle: d.websiteTitle ?? null,
        websiteTagline: d.websiteTagline ?? null,
        aboutText: d.aboutText ?? null,
        primaryColor: d.primaryColor,
        accentColor: d.accentColor,
        facebook: d.facebook ?? null,
        instagram: d.instagram ?? null,
        linkedin: d.linkedin ?? null,
        x: d.x ?? null,
        showCheapest: d.showCheapest,
        ...(logoPath ? { logoPath } : {}),
        ...(fd.get("removeLogo") === "on" ? { logoPath: null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(schema.agency.id, 1))
      .run();
    revalidatePath("/", "layout");
    return { ok: true, message: "Página web actualizada" };
  } catch (e) {
    if (e instanceof Error && /no es una imagen|supera/.test(e.message)) return { ok: false, error: e.message };
    return fail(e);
  }
}
