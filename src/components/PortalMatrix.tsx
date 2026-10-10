"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import clsx from "clsx";
import { togglePortal, bulkPortal } from "@/app/(app)/propiedades/actions";
import { alertToast } from "@/components/forms";

type Row = { id: number; ref: string; title: string; price: string; status: string; on: number[]; editable: boolean };

export function PortalMatrix({ rows, portals }: { rows: Row[]; portals: { id: number; name: string }[] }) {
  const [sel, setSel] = useState<number[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const toggle = (propertyId: number, portalId: number) => {
    setBusy(`${propertyId}:${portalId}`);
    start(async () => {
      const fd = new FormData();
      fd.set("propertyId", String(propertyId));
      fd.set("portalId", String(portalId));
      const r = await togglePortal(null, fd);
      if (r?.error) alertToast(r.error);
      router.refresh();
      setBusy(null);
    });
  };
  const bulk = (portalId: number, mode: "on" | "off") =>
    start(async () => {
      setBusy("bulk");
      const fd = new FormData();
      sel.forEach((i) => fd.append("ids", String(i)));
      fd.set("portalId", String(portalId));
      fd.set("mode", mode);
      const r = await bulkPortal(null, fd);
      if (r?.error) alertToast(r.error);
      else alertToast(r?.message ?? "Hecho", "ok");
      router.refresh();
      setBusy(null);
    });
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">{sel.length} seleccionadas</span>
        <button disabled={!sel.length || busy === "bulk"} onClick={() => bulk(0, "on")} className="btn-primary btn-sm">
          Publicar en todos
        </button>
        <button disabled={!sel.length || busy === "bulk"} onClick={() => bulk(0, "off")} className="btn-secondary btn-sm">
          Retirar de todos
        </button>
        {busy === "bulk" && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th className="w-8">
                <input type="checkbox" checked={sel.length === rows.length && rows.length > 0} onChange={(e) => setSel(e.target.checked ? rows.map((r) => r.id) : [])} className="h-4 w-4 accent-brand-600" aria-label="Seleccionar todas" />
              </th>
              <th>Inmueble</th>
              {portals.map((p) => (
                <th key={p.id} className="text-center">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <input type="checkbox" checked={sel.includes(r.id)} onChange={(e) => setSel(e.target.checked ? [...sel, r.id] : sel.filter((x) => x !== r.id))} className="h-4 w-4 accent-brand-600" aria-label={`Seleccionar ${r.ref}`} />
                </td>
                <td>
                  <a href={`/propiedades/${r.id}?tab=portales`} className="font-medium hover:text-brand-600">
                    <span className="text-brand-600">{r.ref}</span> · <span className="inline-block max-w-56 truncate align-bottom">{r.title}</span>
                  </a>
                  <p className="text-xs text-muted">{r.price}</p>
                </td>
                {portals.map((p) => {
                  const on = r.on.includes(p.id);
                  return (
                    <td key={p.id} className="text-center">
                      <button
                        disabled={!r.editable || !!busy}
                        onClick={() => toggle(r.id, p.id)}
                        className={clsx("mx-auto grid h-7 w-7 place-items-center rounded-md border transition", on ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-brand-500", !r.editable && "opacity-40")}
                        aria-label={`${on ? "Retirar de" : "Publicar en"} ${p.name}`}
                      >
                        {busy === `${r.id}:${p.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : on && <Check className="h-4 w-4" strokeWidth={3} />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
