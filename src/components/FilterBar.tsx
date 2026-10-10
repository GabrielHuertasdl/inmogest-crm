"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

export type FilterDef = { name: string; label: string; type?: "select" | "number" | "text"; options?: { value: string; label: string }[]; placeholder?: string };

/** URL-driven filter bar: main search + collapsible advanced filters. */
export function FilterBar({ filters, searchPlaceholder = "Buscar…", extra }: { filters: FilterDef[]; searchPlaceholder?: string; extra?: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const active = filters.filter((f) => sp.get(f.name)).length;
  const [open, setOpen] = useState(active > 0);
  const submit = (form: HTMLFormElement) => {
    const fd = new FormData(form);
    const p = new URLSearchParams();
    for (const [k, v] of fd.entries()) if (typeof v === "string" && v.trim()) p.set(k, v.trim());
    for (const keep of ["view", "sort", "tab"]) if (sp.get(keep) && !p.has(keep)) p.set(keep, sp.get(keep)!);
    router.push(`${path}?${p.toString()}`);
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(e.currentTarget);
      }}
      onChange={(e) => {
        if ((e.target as HTMLElement).tagName === "SELECT") submit(e.currentTarget);
      }}
      className="card mb-6 p-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={sp.get("q") ?? ""} placeholder={searchPlaceholder} className="input h-10 pl-9" />
        </div>
        <button type="button" onClick={() => setOpen(!open)} className="btn-secondary h-10">
          <SlidersHorizontal className="h-4 w-4" /> Filtros {active > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">{active}</span>}
        </button>
        <button className="btn-primary h-10">Buscar</button>
        {(active > 0 || sp.get("q")) && (
          <button type="button" onClick={() => router.push(path + (sp.get("view") ? `?view=${sp.get("view")}` : ""))} className="btn-ghost h-10">
            <X className="h-4 w-4" /> Limpiar
          </button>
        )}
        {extra}
      </div>
      {open && (
        <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {filters.map((f) => (
            <label key={f.name} className="block">
              <span className="label">{f.label}</span>
              {f.type === "select" || f.options ? (
                <select name={f.name} defaultValue={sp.get(f.name) ?? ""} className="input h-10">
                  <option value="">Todos</option>
                  {f.options!.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input name={f.name} type={f.type === "number" ? "number" : "text"} min={0} defaultValue={sp.get(f.name) ?? ""} placeholder={f.placeholder} className="input h-10" />
              )}
            </label>
          ))}
        </div>
      )}
    </form>
  );
}
