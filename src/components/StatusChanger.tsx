"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { changeStatus } from "@/app/(app)/propiedades/actions";
import { Modal, alertToast } from "@/components/forms";
import { PROPERTY_STATUS } from "@/lib/constants";

const TONE: Record<string, string> = {
  disponible: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reservado: "bg-amber-50 text-amber-700 border-amber-200",
  vendido: "bg-brand-50 text-brand-700 border-brand-200",
  alquilado: "bg-violet-50 text-violet-700 border-violet-200",
  retirado: "bg-slate-100 text-slate-600 border-slate-200",
  borrador: "bg-slate-100 text-slate-600 border-slate-200",
};

export function StatusChanger({ id, status, price, disabled }: { id: number; status: string; price: number; disabled?: boolean }) {
  const [pending, start] = useTransition();
  const [closing, setClosing] = useState<string | null>(null);
  const [final, setFinal] = useState(String(price));
  const router = useRouter();
  const send = (s: string, closedPrice?: string) =>
    start(async () => {
      const fd = new FormData();
      fd.set("id", String(id));
      fd.set("status", s);
      if (closedPrice) fd.set("closedPrice", closedPrice);
      const r = await changeStatus(null, fd);
      if (r?.error) alertToast(r.error);
      else alertToast(`Estado: ${PROPERTY_STATUS[s]}`, "ok");
      router.refresh();
    });
  return (
    <div className="flex items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
      <select
        value={status}
        disabled={disabled || pending}
        onChange={(e) => {
          const s = e.target.value;
          if (s === "vendido" || s === "alquilado") setClosing(s);
          else send(s);
        }}
        className={`rounded-lg border px-3 py-2 text-sm font-medium outline-none ${TONE[status] ?? ""}`}
        aria-label="Cambiar estado"
      >
        {Object.entries(PROPERTY_STATUS).map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </select>
      <Modal open={!!closing} onClose={() => setClosing(null)} title={closing === "vendido" ? "Marcar como vendido" : "Marcar como alquilado"}>
        <label className="block">
          <span className="label">{closing === "vendido" ? "Precio final de venta (€)" : "Renta mensual acordada (€)"}</span>
          <input type="number" min={0} value={final} onChange={(e) => setFinal(e.target.value)} className="input" />
        </label>
        <p className="mt-2 text-xs text-muted">Se usará para calcular los ingresos estimados en la vista general.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setClosing(null)}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              send(closing!, final);
              setClosing(null);
            }}
          >
            Confirmar
          </button>
        </div>
      </Modal>
    </div>
  );
}
