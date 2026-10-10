import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { Share2 } from "lucide-react";
import { requireUser, canEdit } from "@/lib/auth/guards";
import { Avatar, Badge, EmptyState, PageHeader } from "@/components/ui";
import { ActionButton } from "@/components/forms";
import { PropertyThumb } from "@/components/PropertyCard";
import { db, schema } from "@/db";
import { coversFor } from "@/lib/queries/properties";
import { commissionOf } from "@/lib/queries/dashboard";
import { OPERATIONS, PROPERTY_STATUS, PROPERTY_TYPES, STATUS_TONE } from "@/lib/constants";
import { euros } from "@/lib/format";
import { toggleShared } from "../propiedades/actions";
import { requestCollaboration } from "./actions";

export const metadata = { title: "Propiedades compartidas" };

export default async function SharedPage({ searchParams }: { searchParams: Promise<{ f?: string; operation?: string }> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const mine = sp.f === "mias";
  const rows = db
    .select({ p: schema.properties, a: schema.users })
    .from(schema.properties)
    .leftJoin(schema.users, eq(schema.users.id, schema.properties.agentId))
    .where(and(eq(schema.properties.isShared, true), mine ? eq(schema.properties.agentId, u.id) : undefined, sp.operation ? eq(schema.properties.operation, sp.operation) : undefined))
    .orderBy(desc(schema.properties.updatedAt))
    .all();
  const covers = coversFor(rows.map((r) => r.p.id));
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Propiedades compartidas" subtitle="Bolsa de inmuebles en colaboración: comparte tu cartera y vende las propiedades de otros agentes repartiendo honorarios." />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {[
          ["", "Todas"],
          ["mias", "Las que comparto"],
        ].map(([k, l]) => (
          <Link key={k} href={`/compartidas${k ? `?f=${k}` : ""}`} className={`rounded-lg px-3 py-2 ${(sp.f ?? "") === k ? "bg-brand-600 text-white" : "bg-white"}`}>
            {l}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={Share2} title="No hay propiedades compartidas" text="Marca una propiedad como «Compartir» desde su ficha para añadirla a la bolsa." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ p, a }) => {
            const share = Math.round((commissionOf(p) * (p.sharedCommissionPct ?? 50)) / 100);
            const own = p.agentId === u.id;
            return (
              <div key={p.id} className="card overflow-hidden">
                <Link href={`/propiedades/${p.id}`} className="relative block">
                  <PropertyThumb src={covers[p.id] ?? null} alt={p.title} className="aspect-[16/9] w-full" />
                  <Badge tone={STATUS_TONE[p.status]} className="absolute top-3 left-3 bg-white">
                    {PROPERTY_STATUS[p.status]}
                  </Badge>
                </Link>
                <div className="p-5">
                  <p className="text-xs font-semibold text-brand-600">{p.ref}</p>
                  <Link href={`/propiedades/${p.id}`} className="font-medium hover:text-brand-600">
                    {p.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {PROPERTY_TYPES[p.type]} · {OPERATIONS[p.operation]} · {[p.zone, p.city].filter(Boolean).join(", ")}
                  </p>
                  <div className="mt-3 flex items-end justify-between">
                    <p className="text-xl font-bold">{euros(p.price)}</p>
                    <div className="text-right text-xs">
                      <p className="text-muted">Honorarios compartidos</p>
                      <p className="font-semibold text-emerald-700">
                        {p.sharedCommissionPct ?? 50}% · ~{euros(share)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                    {a && (
                      <span className="flex items-center gap-2 text-sm">
                        <Avatar name={a.name} color={a.color} size={28} /> {a.name}
                      </span>
                    )}
                    {own || canEdit(u, p) ? (
                      <ActionButton action={toggleShared} fields={{ id: p.id }} className="btn-secondary btn-sm">
                        Dejar de compartir
                      </ActionButton>
                    ) : (
                      <ActionButton action={requestCollaboration} fields={{ id: p.id }} className="btn-primary btn-sm">
                        Solicitar colaboración
                      </ActionButton>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
