"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth/guards";
import { fail, parse, zs, type ActionState } from "@/lib/actions";
import { estimate } from "@/lib/valuation";

const V = z.object({
  type: z.string().min(1),
  operation: z.enum(["venta", "alquiler"]),
  area: z.coerce.number({ error: "Superficie obligatoria" }).int().positive("Superficie obligatoria"),
  rooms: zs.int,
  baths: zs.int,
  condition: z.enum(["nuevo", "buen_estado", "a_reformar"]).default("buen_estado"),
  city: zs.str,
  zone: zs.str,
  address: zs.str,
  ownerName: zs.str,
  propertyId: zs.id,
});

export async function saveValuation(_: ActionState, fd: FormData): Promise<ActionState> {
  let id: number;
  try {
    const u = await requireUser();
    const p = parse(V, fd);
    if ("state" in p) return p.state;
    const d = p.data;
    const r = estimate({ ...d, excludeId: d.propertyId });
    if (!r) return { ok: false, error: "No hay suficientes comparables para valorar este inmueble" };
    id = db
      .insert(schema.valuations)
      .values({
        propertyId: d.propertyId ?? null,
        ownerName: d.ownerName ?? null,
        address: d.address ?? null,
        city: d.city ?? null,
        zone: d.zone ?? null,
        type: d.type,
        operation: d.operation,
        area: d.area,
        rooms: d.rooms ?? null,
        baths: d.baths ?? null,
        condition: d.condition,
        comparableIds: JSON.stringify(r.comparables.map((c) => c.id)),
        pricePerM2Median: r.pricePerM2,
        estimatedLow: r.low,
        estimated: r.estimated,
        estimatedHigh: r.high,
        agentId: u.id,
      })
      .returning({ id: schema.valuations.id })
      .get().id;
  } catch (e) {
    return fail(e);
  }
  redirect(`/print/tasacion/${id}`);
}
