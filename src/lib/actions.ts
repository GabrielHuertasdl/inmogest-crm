import "server-only";
import { z } from "zod";
import { ActionError } from "./auth/guards";

export type ActionState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string[] | undefined>; message?: string; data?: unknown } | null;

/** FormData → plain object; repeated keys become arrays; empty strings become undefined. */
export function formToObject(fd: FormData) {
  const o: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (k.startsWith("$ACTION")) continue;
    const val = typeof v === "string" ? (v.trim() === "" ? undefined : v.trim()) : v;
    if (k.endsWith("[]")) {
      const key = k.slice(0, -2);
      const arr = (o[key] as unknown[]) ?? [];
      if (val !== undefined) arr.push(val);
      o[key] = arr;
    } else o[k] = val;
  }
  return o;
}

export function parse<T extends z.ZodType>(schema: T, fd: FormData): { data: z.infer<T> } | { state: ActionState } {
  const r = schema.safeParse(formToObject(fd));
  if (!r.success) {
    const fe = z.flattenError(r.error).fieldErrors as Record<string, string[]>;
    return { state: { ok: false, error: "Revisa los campos marcados", fieldErrors: fe } };
  }
  return { data: r.data };
}

export function fail(e: unknown): ActionState {
  if (e instanceof ActionError) return { ok: false, error: e.message };
  // Re-throw Next control-flow errors (redirect / notFound)
  if (e && typeof e === "object" && "digest" in e) throw e;
  console.error(e);
  const msg = e instanceof Error && /UNIQUE/.test(e.message) ? "Ya existe un registro con ese valor único" : "Ha ocurrido un error inesperado";
  return { ok: false, error: msg };
}

/** zod helpers for form inputs */
export const zs = {
  str: z.string().max(5000).optional(),
  req: (msg = "Obligatorio") => z.string({ error: msg }).min(1, msg).max(500),
  int: z.coerce.number().int().min(0).optional(),
  num: z.coerce.number().min(0).optional(),
  id: z.coerce.number().int().positive().optional(),
  bool: z.preprocess((v) => v === "on" || v === "true" || v === "1" || v === true, z.boolean()),
  arr: z.array(z.string()).optional().default([]),
  email: z.email("Email no válido").optional(),
};
