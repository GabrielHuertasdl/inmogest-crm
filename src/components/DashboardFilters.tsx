"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Download, FileSpreadsheet, Printer, ChevronDown } from "lucide-react";

export function DashboardFilters({ agents, agent, from, to, isAdmin }: { agents: { id: number; name: string }[]; agent: string; from: string; to: string; isAdmin: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const set = (patch: Record<string, string>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.push(`/dashboard?${p.toString()}`);
  };
  const y = new Date().getFullYear();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const presets = [
    { label: "Este mes", from: iso(new Date(Date.UTC(y, new Date().getMonth(), 1))), to: iso(new Date(Date.UTC(y, new Date().getMonth() + 1, 0))) },
    { label: "Últimos 3 meses", from: iso(new Date(Date.UTC(y, new Date().getMonth() - 2, 1))), to: iso(new Date(Date.UTC(y, new Date().getMonth() + 1, 0))) },
    { label: "Últimos 12 meses", from: iso(new Date(Date.UTC(y, new Date().getMonth() - 11, 1))), to: iso(new Date(Date.UTC(y, new Date().getMonth() + 1, 0))) },
    { label: "Este año", from: `${y}-01-01`, to: `${y}-12-31` },
  ];
  const qs = new URLSearchParams({ agent, from, to }).toString();
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="btn-secondary h-11 rounded-xl">
          <Download className="h-4 w-4" /> Descargar informe <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {open && (
          <div className="absolute left-0 z-20 mt-2 w-56 rounded-xl border border-line bg-white p-2 shadow-lg" onMouseLeave={() => setOpen(false)}>
            <a href={`/api/informes/dashboard.csv?${qs}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Excel (CSV)
            </a>
            <a href={`/print/informe?${qs}`} target="_blank" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
              <Printer className="h-4 w-4 text-brand-600" /> PDF / Imprimir
            </a>
          </div>
        )}
      </div>
      <label className="flex h-11 items-center gap-2 rounded-xl border border-line bg-white pl-4 text-sm">
        <span className="text-ink">Agente:</span>
        <select value={agent} onChange={(e) => set({ agent: e.target.value })} className="h-full min-w-48 rounded-r-xl bg-transparent pr-3 outline-none" disabled={!isAdmin && agents.length <= 1}>
          {isAdmin && <option value="all">Todos los agentes</option>}
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm">
        <input type="date" value={from} onChange={(e) => set({ from: e.target.value })} className="bg-transparent outline-none" aria-label="Desde" />
        <span className="text-muted">→</span>
        <input type="date" value={to} onChange={(e) => set({ to: e.target.value })} className="bg-transparent outline-none" aria-label="Hasta" />
      </div>
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <button key={p.label} onClick={() => set({ from: p.from, to: p.to })} className={`rounded-lg px-3 py-1.5 text-xs ${from === p.from && to === p.to ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
