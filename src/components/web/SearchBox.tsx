import { Search } from "lucide-react";
import { OPERATIONS, PROPERTY_TYPES } from "@/lib/constants";

export function SearchBox({ cities, values = {}, inline }: { cities: string[]; values?: Record<string, string | undefined>; inline?: boolean }) {
  const sel = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[var(--brand)]";
  return (
    <form action="/web/propiedades" className={inline ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-6" : "grid gap-3 rounded-2xl bg-white p-4 shadow-xl sm:grid-cols-2 lg:grid-cols-5"}>
      <select name="operation" defaultValue={values.operation ?? ""} className={sel} aria-label="Operación">
        <option value="">Comprar o alquilar</option>
        {Object.entries(OPERATIONS).map(([k, l]) => (
          <option key={k} value={k}>
            {k === "venta" ? "Comprar" : k === "alquiler" ? "Alquilar" : l}
          </option>
        ))}
      </select>
      <select name="type" defaultValue={values.type ?? ""} className={sel} aria-label="Tipo">
        <option value="">Cualquier tipo</option>
        {Object.entries(PROPERTY_TYPES).map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </select>
      <select name="city" defaultValue={values.city ?? ""} className={sel} aria-label="Ubicación">
        <option value="">Cualquier ubicación</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input name="maxPrice" type="number" min={0} step={1000} defaultValue={values.maxPrice ?? ""} placeholder="Precio máximo (€)" className={sel} />
      {inline && <input name="rooms" type="number" min={0} defaultValue={values.rooms ?? ""} placeholder="Habitaciones mín." className={sel} />}
      <button className="flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90">
        <Search className="h-4 w-4" /> Buscar
      </button>
    </form>
  );
}
