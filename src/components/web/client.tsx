"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Heart, ChevronLeft, ChevronRight, X, Loader2, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

const KEY = "ig_favs";
const read = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
};

function subscribe(cb: () => void) {
  window.addEventListener("ig-favs", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("ig-favs", cb);
    window.removeEventListener("storage", cb);
  };
}
const snapshot = () => {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
};

export function useFavs() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const favs = useMemo<string[]>(() => {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }, [raw]);
  const toggle = (ref: string) => {
    const cur = read();
    const next = cur.includes(ref) ? cur.filter((r) => r !== ref) : [...cur, ref];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    window.dispatchEvent(new Event("ig-favs"));
  };
  return { favs, toggle };
}

export function FavButton({ refCode, className }: { refCode: string; className?: string }) {
  const { favs, toggle } = useFavs();
  const on = favs.includes(refCode);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(refCode);
      }}
      className={clsx("grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow transition hover:scale-105", className)}
      aria-label={on ? "Quitar de favoritos" : "Añadir a favoritos"}
      aria-pressed={on}
    >
      <Heart className={clsx("h-5 w-5", on ? "fill-[var(--brand)] text-[var(--brand)]" : "text-slate-600")} />
    </button>
  );
}

export function FavCount() {
  const { favs } = useFavs();
  return favs.length ? <span className="ml-1 rounded-full bg-[var(--brand)] px-1.5 text-xs text-white">{favs.length}</span> : null;
}

export function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") setI((x) => (x + 1) % photos.length);
      if (e.key === "ArrowLeft") setI((x) => (x - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, photos.length]);
  if (!photos.length) return <div className="grid aspect-[16/9] place-items-center rounded-2xl bg-slate-100 text-slate-400">Sin fotos</div>;
  return (
    <>
      <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
        <button onClick={() => setOpen(true)} className="relative overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/files/${photos[0]}`} alt={title} className="aspect-[16/10] w-full object-cover transition hover:scale-[1.02]" />
          <span className="absolute right-3 bottom-3 rounded-lg bg-black/60 px-3 py-1 text-sm text-white">Ver {photos.length} fotos</span>
        </button>
        <div className="hidden grid-rows-2 gap-2 md:grid">
          {photos.slice(1, 3).map((p, k) => (
            <button key={p} onClick={() => (setI(k + 1), setOpen(true))} className="overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/files/${p}`} alt="" className="h-full w-full object-cover transition hover:scale-[1.03]" />
            </button>
          ))}
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setOpen(false)}>
          <button className="absolute top-4 right-4 text-white" aria-label="Cerrar">
            <X className="h-8 w-8" />
          </button>
          <button
            className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setI((i - 1 + photos.length) % photos.length);
            }}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/files/${photos[i]}`} alt="" className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <button
            className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setI((i + 1) % photos.length);
            }}
            aria-label="Siguiente"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
          <span className="absolute bottom-4 text-sm text-white/80">
            {i + 1} / {photos.length}
          </span>
        </div>
      )}
    </>
  );
}

const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function MortgageCalculator({ price: initial = 200000, compact }: { price?: number; compact?: boolean }) {
  const [price, setPrice] = useState(initial);
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(3);
  const [years, setYears] = useState(30);
  const r = useMemo(() => {
    const P = price * (1 - down / 100);
    const i = rate / 100 / 12;
    const n = years * 12;
    const m = i === 0 ? P / n : (P * i) / (1 - Math.pow(1 + i, -n));
    return { loan: P, monthly: m, interest: m * n - P, costs: price * 0.1 };
  }, [price, down, rate, years]);
  const slider = (label: string, value: number, set: (v: number) => void, min: number, max: number, step: number, fmt: (v: number) => string) => (
    <label className="block">
      <span className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <b>{fmt(value)}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className="mt-2 w-full accent-[var(--brand)]" />
    </label>
  );
  return (
    <div className={clsx("grid gap-6", !compact && "md:grid-cols-2")}>
      <div className="space-y-5">
        {slider("Precio de la vivienda", price, setPrice, 30000, 2000000, 5000, eur.format)}
        {slider("Entrada", down, setDown, 0, 80, 1, (v) => `${v}% · ${eur.format((price * v) / 100)}`)}
        {slider("Tipo de interés (TIN)", rate, setRate, 0, 8, 0.05, (v) => `${v.toFixed(2).replace(".", ",")}%`)}
        {slider("Plazo", years, setYears, 5, 40, 1, (v) => `${v} años`)}
      </div>
      <div className="rounded-2xl bg-[var(--brand)] p-6 text-white">
        <p className="text-sm opacity-80">Cuota mensual estimada</p>
        <p className="text-4xl font-bold">{eur2.format(r.monthly)}</p>
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="opacity-80">Importe del préstamo</dt>
            <dd className="font-semibold">{eur.format(r.loan)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="opacity-80">Intereses totales</dt>
            <dd className="font-semibold">{eur.format(r.interest)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="opacity-80">Gastos de compra aprox. (10%)</dt>
            <dd className="font-semibold">{eur.format(r.costs)}</dd>
          </div>
          <div className="flex justify-between border-t border-white/20 pt-2">
            <dt className="opacity-80">Ahorro necesario</dt>
            <dd className="font-semibold">{eur.format((price * down) / 100 + r.costs)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-[11px] opacity-70">Cálculo orientativo con sistema de amortización francés. No constituye una oferta vinculante.</p>
      </div>
    </div>
  );
}

export function ContactForm({ propertyRef, compact }: { propertyRef?: string; compact?: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [err, setErr] = useState("");
  return state === "ok" ? (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-emerald-50 p-8 text-center text-emerald-800">
      <CheckCircle2 className="h-10 w-10" />
      <p className="font-semibold">¡Mensaje enviado!</p>
      <p className="text-sm">Te contactaremos lo antes posible.</p>
    </div>
  ) : (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        const fd = new FormData(e.currentTarget);
        const body = Object.fromEntries(fd.entries());
        const r = await fetch("/api/public/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, consent: fd.get("consent") === "on" }) });
        if (r.ok) setState("ok");
        else {
          setErr((await r.json().catch(() => ({}))).error ?? "No se ha podido enviar");
          setState("error");
        }
      }}
    >
      {propertyRef && <input type="hidden" name="propertyRef" value={propertyRef} />}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input name="name" required placeholder="Nombre *" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
      <div className={clsx("grid gap-3", !compact && "sm:grid-cols-2")}>
        <input name="email" type="email" placeholder="Email" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
        <input name="phone" type="tel" placeholder="Teléfono" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
      </div>
      <textarea name="message" required rows={4} defaultValue={propertyRef ? `Hola, estoy interesado/a en el inmueble ${propertyRef}. Me gustaría recibir más información.` : ""} placeholder="Mensaje *" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
      <label className="flex items-start gap-2 text-xs text-slate-500">
        <input type="checkbox" name="consent" required className="mt-0.5 accent-[var(--brand)]" /> He leído y acepto la política de privacidad y el tratamiento de mis datos para gestionar mi consulta.
      </label>
      {state === "error" && <p className="text-sm text-red-600">{err}</p>}
      <button disabled={state === "sending"} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
        {state === "sending" && <Loader2 className="h-4 w-4 animate-spin" />} Enviar mensaje
      </button>
    </form>
  );
}

export function FavoritesList() {
  const { favs } = useFavs();
  const [items, setItems] = useState<{ ref: string; title: string; price: number; operation: string; cover: string | null; city: string | null; zone: string | null }[] | null>(null);
  useEffect(() => {
    if (!favs.length) return;
    fetch(`/api/public/properties?refs=${favs.join(",")}`)
      .then((r) => r.json())
      .then((d) => setItems(d.properties));
  }, [favs]);
  if (!favs.length) return <p className="py-12 text-center text-slate-500">Aún no has guardado ninguna propiedad. Pulsa el corazón en cualquier inmueble para añadirlo aquí.</p>;
  if (items === null) return <p className="py-12 text-center text-slate-500">Cargando…</p>;
  if (!items.length) return <p className="py-12 text-center text-slate-500">Aún no has guardado ninguna propiedad. Pulsa el corazón en cualquier inmueble para añadirlo aquí.</p>;
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <Link key={p.ref} href={`/web/propiedades/${p.ref}`} className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.cover ? <img src={`/files/${p.cover}`} alt={p.title} className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] bg-slate-100" />}
          <FavButton refCode={p.ref} className="absolute top-3 right-3" />
          <div className="p-4">
            <p className="text-xl font-bold">
              {eur.format(p.price)}
              {p.operation === "alquiler" && <span className="text-sm font-normal text-slate-500">/mes</span>}
            </p>
            <p className="truncate font-medium">{p.title}</p>
            <p className="text-sm text-slate-500">{[p.zone, p.city].filter(Boolean).join(", ")}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
