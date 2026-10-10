import clsx from "clsx";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export { clsx as cx };

const TONES: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/15",
  blue: "bg-brand-50 text-brand-700 ring-brand-600/15",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/15",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/15",
  red: "bg-red-50 text-red-700 ring-red-600/15",
  gray: "bg-slate-100 text-slate-600 ring-slate-500/15",
};

export function Badge({ tone = "gray", children, className }: { tone?: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap", TONES[tone] ?? TONES.gray, className)}>
      {children}
    </span>
  );
}

export function Card({ title, subtitle, actions, children, className, bodyClass }: { title?: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; children?: React.ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={clsx("card", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5">
          <div>
            {title && <h2 className="text-lg font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={clsx("p-6", (title || actions) && "pt-4", bodyClass)}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions, back }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; back?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <Link href={back} className="mb-1 inline-block text-sm text-brand-600 hover:underline">
            ← Volver
          </Link>
        )}
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon?: LucideIcon; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-slate-50/50 px-6 py-12 text-center">
      {Icon && <Icon className="mb-3 h-10 w-10 text-slate-300" strokeWidth={1.5} />}
      <p className="font-medium text-ink">{title}</p>
      {text && <p className="mt-1 max-w-md text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, icon: Icon, tone = "blue", hint }: { label: string; value: React.ReactNode; icon?: LucideIcon; tone?: "blue" | "green" | "violet" | "amber" | "red" | "slate"; hint?: React.ReactNode }) {
  const t = {
    blue: ["bg-brand-50", "bg-brand-100 text-brand-600", "text-brand-700", "text-brand-900"],
    green: ["bg-emerald-50", "bg-emerald-100 text-emerald-600", "text-emerald-700", "text-emerald-900"],
    violet: ["bg-violet-50", "bg-violet-100 text-violet-600", "text-violet-700", "text-violet-900"],
    amber: ["bg-amber-50", "bg-amber-100 text-amber-600", "text-amber-700", "text-amber-900"],
    red: ["bg-red-50", "bg-red-100 text-red-600", "text-red-700", "text-red-900"],
    slate: ["bg-slate-50", "bg-slate-100 text-slate-600", "text-slate-600", "text-slate-900"],
  }[tone];
  return (
    <div className={clsx("flex items-center gap-4 rounded-2xl p-5", t[0])}>
      {Icon && (
        <div className={clsx("grid h-12 w-12 shrink-0 place-items-center rounded-full", t[1])}>
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
      )}
      <div className="min-w-0">
        <p className={clsx("text-sm", t[2])}>{label}</p>
        <p className={clsx("text-xl font-bold", t[3])}>{value}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}

export function Field({ label, error, children, className, hint }: { label?: string; error?: string | string[]; children: React.ReactNode; className?: string; hint?: string }) {
  const e = Array.isArray(error) ? error[0] : error;
  return (
    <label className={clsx("block", className)}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && !e && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {e && <span className="mt-1 block text-xs text-red-600">{e}</span>}
    </label>
  );
}

export function Select({ options, placeholder, className, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: Record<string, string> | { value: string | number; label: string }[]; placeholder?: string }) {
  const list = Array.isArray(options) ? options : Object.entries(options).map(([value, label]) => ({ value, label }));
  return (
    <select className={clsx("input", className)} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {list.map((o) => (
        <option key={String(o.value)} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Avatar({ name, color = "#3463e6", size = 36, src }: { name: string; color?: string; size?: number; src?: string | null }) {
  const ini = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-semibold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {ini}
    </span>
  );
}

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2);
  return (
    <nav className="flex items-center justify-center gap-1 pt-4 text-sm">
      {page > 1 && (
        <Link className="btn-ghost btn-sm" href={href(page - 1)}>
          ‹ Anterior
        </Link>
      )}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1">
          {i > 0 && n - nums[i - 1]! > 1 && <span className="px-1 text-muted">…</span>}
          <Link href={href(n)} className={clsx("grid h-8 min-w-8 place-items-center rounded-lg px-2", n === page ? "bg-brand-600 text-white" : "hover:bg-slate-100")}>
            {n}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link className="btn-ghost btn-sm" href={href(page + 1)}>
          Siguiente ›
        </Link>
      )}
    </nav>
  );
}

export function Tabs({ tabs, active, base }: { tabs: { key: string; label: string; count?: number }[]; active: string; base: string }) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={`${base}${base.includes("?") ? "&" : "?"}tab=${t.key}`}
          scroll={false}
          className={clsx(
            "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition",
            active === t.key ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-ink",
          )}
        >
          {t.label}
          {t.count != null && <span className="rounded-full bg-slate-100 px-1.5 text-xs text-slate-600">{t.count}</span>}
        </Link>
      ))}
    </div>
  );
}

export function DL({ items, cols = 2 }: { items: [string, React.ReactNode][]; cols?: number }) {
  return (
    <dl className={clsx("grid gap-x-6 gap-y-4", cols === 3 ? "sm:grid-cols-3" : cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2")}>
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-muted">{k}</dt>
          <dd className="mt-0.5 text-sm font-medium text-ink">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ScoreRing({ value }: { value: number }) {
  const color = value >= 80 ? "#16a34a" : value >= 60 ? "#3463e6" : value >= 40 ? "#d97706" : "#94a3b8";
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid h-11 w-11 place-items-center">
      <svg width="44" height="44" className="-rotate-90">
        <circle cx="22" cy="22" r={r} stroke="#eef1f6" strokeWidth="4" fill="none" />
        <circle cx="22" cy="22" r={r} stroke={color} strokeWidth="4" fill="none" strokeDasharray={`${(c * value) / 100} ${c}`} strokeLinecap="round" />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>
        {value}
      </span>
    </span>
  );
}
