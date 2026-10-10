"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, Plus, Info, MessageSquareText, CalendarDays, House, Users, HousePlus, CalendarPlus, ListPlus, FilePlus2, ClipboardSignature, Loader2, UserRound, LogOut, ChevronDown } from "lucide-react";
import type { ShellUser } from "./AppShell";
import { Avatar } from "@/components/ui";
import { Modal } from "@/components/forms";
import { APP_NAME, APP_VERSION } from "@/lib/constants";
import { logout } from "@/app/(auth)/login/actions";

type Hit = { kind: string; id: number; title: string; sub: string; href: string };

export function Topbar({ user, unread, todayEvents, onToggle }: { user: ShellUser; unread: number; todayEvents: number; onToggle: () => void }) {
  const [plus, setPlus] = useState(false);
  const [menu, setMenu] = useState(false);
  const [info, setInfo] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const first = user.name.split(" ")[0];
  const router = useRouter();

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.altKey && !e.ctrlKey) {
        const map: Record<string, string> = { p: "/propiedades/nueva", c: "/clientes/nuevo", e: "/calendario?new=1", d: "/dashboard" };
        const to = map[e.key.toLowerCase()];
        if (to) {
          e.preventDefault();
          router.push(to);
        }
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [router]);

  const quick = [
    { label: "Propiedad", href: "/propiedades/nueva", icon: House },
    { label: "Cliente", href: "/clientes/nuevo", icon: Users },
    { label: "Captación", href: "/captaciones/nueva", icon: HousePlus },
    { label: "Evento", href: "/calendario?new=1", icon: CalendarPlus },
    { label: "Tarea", href: "/tareas?new=1", icon: ListPlus },
    { label: "Factura", href: "/facturas/nueva", icon: FilePlus2 },
    { label: "Parte de visita", href: "/partes-visita/nuevo", icon: ClipboardSignature },
  ];

  return (
    <header className="no-print flex h-[76px] shrink-0 items-center gap-3 border-b border-line bg-white px-4 sm:px-8">
      <button onClick={onToggle} className="rounded-lg p-2 text-ink hover:bg-slate-100" aria-label="Menú">
        <Menu className="h-7 w-7" strokeWidth={1.8} />
      </button>
      <button onClick={() => setSearchOpen(true)} className="ml-2 flex h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm text-muted hover:border-slate-300 sm:w-64" aria-label="Buscar">
        <Search className="h-5 w-5" />
        <span className="hidden sm:inline">Buscar…</span>
        <kbd className="ml-auto hidden rounded border border-line px-1.5 text-[10px] sm:inline">Ctrl K</kbd>
      </button>
      <Link href="/web" target="_blank" className="hidden px-3 text-sm font-medium text-brand-600 hover:underline md:inline">
        Ver web
      </Link>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="relative">
          <IconBtn onClick={() => setPlus(!plus)} label="Crear">
            <Plus className="h-5 w-5" />
          </IconBtn>
          {plus && (
            <Dropdown onClose={() => setPlus(false)}>
              <p className="px-3 pt-1 pb-2 text-xs font-semibold text-muted uppercase">Crear nuevo</p>
              {quick.map((q) => (
                <Link key={q.label} href={q.href} onClick={() => setPlus(false)} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
                  <q.icon className="h-4 w-4 text-brand-600" /> {q.label}
                </Link>
              ))}
            </Dropdown>
          )}
        </div>
        <IconBtn onClick={() => setInfo(true)} label="Información">
          <Info className="h-5 w-5" />
        </IconBtn>
        <IconBtn href="/mensajes" label="Mensajes" badge={unread}>
          <MessageSquareText className="h-5 w-5" />
        </IconBtn>
        <IconBtn href="/calendario" label="Calendario" badge={todayEvents}>
          <CalendarDays className="h-5 w-5" />
        </IconBtn>
        <div className="relative ml-1">
          <button onClick={() => setMenu(!menu)} className="flex h-11 items-center gap-3 rounded-xl bg-brand-600 pr-1 pl-4 text-sm font-medium text-white hover:bg-brand-700">
            <span className="hidden sm:inline">Hola, {first}</span>
            <ChevronDown className="h-4 w-4 sm:hidden" />
            <Avatar name={user.name} color="#ffffff33" size={36} src={user.avatarPath ? `/files/${user.avatarPath}` : null} />
          </button>
          {menu && (
            <Dropdown onClose={() => setMenu(false)}>
              <div className="border-b border-line px-3 pt-1 pb-3">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted">{user.email}</p>
              </div>
              <Link href="/mi-cuenta" onClick={() => setMenu(false)} className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
                <UserRound className="h-4 w-4" /> Mi cuenta
              </Link>
              <form action={logout}>
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" /> Salir
                </button>
              </form>
            </Dropdown>
          )}
        </div>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Modal open={info} onClose={() => setInfo(false)} title={`${APP_NAME} ${APP_VERSION}`}>
        <div className="space-y-4 text-sm text-slate-600">
          <p>CRM inmobiliario: propiedades, clientes, cruces, captaciones, agenda, mensajes, facturación y página web pública.</p>
          <div>
            <p className="mb-2 font-medium text-ink">Atajos de teclado</p>
            <ul className="space-y-1">
              {[
                ["Ctrl + K", "Buscar"],
                ["Alt + P", "Nueva propiedad"],
                ["Alt + C", "Nuevo cliente"],
                ["Alt + E", "Nuevo evento"],
                ["Alt + D", "Vista general"],
              ].map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span>{v}</span>
                  <kbd className="rounded border border-line bg-slate-50 px-2 text-xs">{k}</kbd>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>
    </header>
  );
}

function IconBtn({ children, href, onClick, label, badge }: { children: React.ReactNode; href?: string; onClick?: () => void; label: string; badge?: number }) {
  const cls = "relative grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition hover:bg-brand-100";
  const b = !!badge && <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">{badge > 99 ? "99+" : badge}</span>;
  if (href)
    return (
      <Link href={href} className={cls} aria-label={label} title={label}>
        {children}
        {b}
      </Link>
    );
  return (
    <button onClick={onClick} className={cls} aria-label={label} title={label}>
      {children}
      {b}
    </button>
  );
}

function Dropdown({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose();
    setTimeout(() => document.addEventListener("mousedown", h));
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 z-30 mt-2 w-60 rounded-xl border border-line bg-white p-2 shadow-lg">
      {children}
    </div>
  );
}

function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [found, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState(0);
  const router = useRouter();
  useEffect(() => {
    if (!open) return;
    if (q.trim().length < 2) return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((d) => {
          setHits(d.hits ?? []);
          setSel(0);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q, open]);
  if (!open) return null;
  const hits = q.trim().length < 2 ? [] : found;
  const go = (h: Hit) => {
    onClose();
    setQ("");
    router.push(h.href);
  };
  const groups = ["Propiedades", "Clientes", "Captaciones"];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-[10vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center gap-3 border-b border-line px-4">
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted" /> : <Search className="h-5 w-5 text-muted" />}
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") setSel((s) => Math.min(s + 1, hits.length - 1));
              if (e.key === "ArrowUp") setSel((s) => Math.max(s - 1, 0));
              if (e.key === "Enter" && hits[sel]) go(hits[sel]);
            }}
            placeholder="Busca por referencia, dirección, cliente, teléfono…"
            className="h-14 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {q.length >= 2 && !loading && hits.length === 0 && <p className="p-6 text-center text-sm text-muted">Sin resultados</p>}
          {groups.map((g) => {
            const list = hits.filter((h) => h.kind === g);
            if (!list.length) return null;
            return (
              <div key={g} className="mb-2">
                <p className="px-3 py-1 text-xs font-semibold text-muted uppercase">{g}</p>
                {list.map((h) => (
                  <button key={h.kind + h.id} onMouseDown={() => go(h)} className={`flex w-full flex-col rounded-lg px-3 py-2 text-left ${hits[sel] === h ? "bg-brand-50" : "hover:bg-slate-50"}`}>
                    <span className="text-sm font-medium">{h.title}</span>
                    <span className="text-xs text-muted">{h.sub}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
