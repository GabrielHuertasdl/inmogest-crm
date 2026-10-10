"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Phone, MapPin } from "lucide-react";
import { moveLead } from "@/app/(app)/captaciones/actions";
import { alertToast } from "@/components/forms";
import { LEAD_STAGES, PROPERTY_TYPES } from "@/lib/constants";

type L = { id: number; ownerName: string; phone: string | null; address: string | null; city: string | null; zone: string | null; type: string | null; expectedPrice: number | null; stage: string; agentName: string | null; agentColor: string | null; propertyId: number | null; age: string };

const HEAD: Record<string, string> = { nuevo: "bg-brand-500", contactado: "bg-sky-500", valoracion: "bg-violet-500", negociacion: "bg-amber-500", captado: "bg-emerald-500", perdido: "bg-slate-400" };
const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function LeadBoard({ leads }: { leads: L[] }) {
  const [opt, move] = useOptimistic(leads, (s, a: { id: number; stage: string }) => s.map((l) => (l.id === a.id ? { ...l, stage: a.stage } : l)));
  const [, start] = useTransition();
  const router = useRouter();
  const drop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("text/lead"));
    if (!id) return;
    start(async () => {
      move({ id, stage });
      const fd = new FormData();
      fd.set("id", String(id));
      fd.set("stage", stage);
      const r = await moveLead(null, fd);
      if (r?.error) alertToast(r.error);
      router.refresh();
    });
  };
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Object.entries(LEAD_STAGES).map(([k, label]) => {
        const col = opt.filter((l) => l.stage === k);
        const sum = col.reduce((s, l) => s + (l.expectedPrice ?? 0), 0);
        return (
          <div key={k} onDragOver={(e) => e.preventDefault()} onDrop={(e) => drop(e, k)} className="flex w-72 shrink-0 flex-col rounded-2xl bg-slate-100/70">
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <span className={clsx("h-2.5 w-2.5 rounded-full", HEAD[k])} />
              <span className="font-semibold">{label}</span>
              <span className="rounded-full bg-white px-2 text-xs text-slate-600">{col.length}</span>
              {sum > 0 && <span className="ml-auto text-xs text-muted">{eur.format(sum)}</span>}
            </div>
            <div className="min-h-32 flex-1 space-y-2 p-2">
              {col.map((l) => (
                <Link
                  key={l.id}
                  href={`/captaciones/${l.id}`}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/lead", String(l.id))}
                  className="block cursor-grab rounded-xl bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing"
                >
                  <p className="text-sm font-medium">{l.ownerName}</p>
                  {(l.address || l.city) && (
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
                      <MapPin className="h-3 w-3 shrink-0" /> {[l.address, l.zone ?? l.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {l.phone && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <Phone className="h-3 w-3" /> {l.phone}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      {l.type ? PROPERTY_TYPES[l.type] : "—"}
                      {l.expectedPrice ? ` · ${eur.format(l.expectedPrice)}` : ""}
                    </span>
                    {l.agentName && (
                      <span className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ background: l.agentColor ?? "#64748b" }} title={l.agentName}>
                        {l.agentName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted">{l.age}</p>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
