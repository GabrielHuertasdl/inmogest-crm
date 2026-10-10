"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markInterest } from "@/app/(app)/clientes/actions";
import { INTEREST_STATUS } from "@/lib/constants";

const STYLE: Record<string, string> = {
  propuesta: "bg-brand-600 text-white",
  interesado: "bg-emerald-600 text-white",
  visitado: "bg-violet-600 text-white",
  descartado: "bg-slate-500 text-white",
};

export function InterestButtons({ clientId, propertyId, status }: { clientId: number; propertyId: number; status?: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = (s: string) =>
    start(async () => {
      const fd = new FormData();
      fd.set("clientId", String(clientId));
      fd.set("propertyId", String(propertyId));
      fd.set("status", s === status ? "" : s);
      await markInterest(null, fd);
      router.refresh();
    });
  return (
    <div className={`flex flex-wrap gap-1 ${pending ? "opacity-50" : ""}`}>
      {Object.entries(INTEREST_STATUS).map(([k, l]) => (
        <button key={k} type="button" disabled={pending} onClick={() => set(k)} className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${status === k ? STYLE[k] : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}
