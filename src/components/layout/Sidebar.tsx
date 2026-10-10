"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import {
  LayoutDashboard,
  House,
  HousePlus,
  Share2,
  Globe2,
  Users,
  MessageSquareText,
  CalendarDays,
  ListChecks,
  FileText,
  Calculator,
  ClipboardSignature,
  Headset,
  PanelsTopLeft,
  UserRound,
  Settings,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "./Logo";
import { logout } from "@/app/(auth)/login/actions";

type Item = { label: string; href?: string; icon: LucideIcon; badge?: number; children?: { label: string; href: string }[]; admin?: boolean; external?: boolean };

export function Sidebar({ collapsed, unread, todayEvents, isAdmin, onNavigate }: { collapsed: boolean; unread: number; todayEvents: number; isAdmin: boolean; onNavigate?: () => void }) {
  const path = usePathname();
  const main: Item[] = [
    { label: "Vista general", href: "/dashboard", icon: LayoutDashboard },
    {
      label: "Propiedades",
      icon: House,
      children: [
        { label: "Listado", href: "/propiedades" },
        { label: "Añadir propiedad", href: "/propiedades/nueva" },
        { label: "Mapa", href: "/propiedades/mapa" },
      ],
    },
    { label: "Captaciones", href: "/captaciones", icon: HousePlus },
    { label: "Propiedades compartidas", href: "/compartidas", icon: Share2 },
    { label: "Portales inmobiliarios", href: "/portales", icon: Globe2 },
    {
      label: "Clientes",
      icon: Users,
      children: [
        { label: "Listado", href: "/clientes" },
        { label: "Añadir cliente", href: "/clientes/nuevo" },
        { label: "Demandas", href: "/clientes/demandas" },
      ],
    },
    { label: "Mensajes", href: "/mensajes", icon: MessageSquareText, badge: unread },
    { label: "Calendario", href: "/calendario", icon: CalendarDays, badge: todayEvents },
    { label: "Tareas", href: "/tareas", icon: ListChecks },
    { label: "Mis facturas", href: "/facturas", icon: FileText },
    { label: "Tasador", href: "/tasador", icon: Calculator },
    { label: "Partes de visita", href: "/partes-visita", icon: ClipboardSignature },
  ];
  const secondary: Item[] = [
    { label: "Agentes inmobiliarios", href: "/agentes", icon: Headset },
    {
      label: "Página web",
      icon: PanelsTopLeft,
      children: [
        { label: "Configuración", href: "/pagina-web" },
        { label: "Ver página web", href: "/web" },
      ],
    },
    { label: "Mi cuenta", href: "/mi-cuenta", icon: UserRound },
    {
      label: "Ajustes",
      icon: Settings,
      children: [
        { label: "Agencia", href: "/ajustes/agencia" },
        { label: "Facturación", href: "/ajustes/facturacion" },
        { label: "Portales", href: "/portales" },
        ...(isAdmin ? [{ label: "Usuarios y permisos", href: "/agentes" }] : []),
      ],
    },
  ];
  return (
    <aside className={clsx("flex h-full flex-col bg-white", collapsed ? "w-[84px]" : "w-[290px]")}>
      <div className={clsx("flex h-[76px] shrink-0 items-center", collapsed ? "justify-center" : "px-7")}>
        <Link href="/dashboard" onClick={onNavigate}>
          <Logo collapsed={collapsed} />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        <ul className="space-y-1">
          {main.map((it) => (
            <NavItem key={it.label} it={it} path={path} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </ul>
        <hr className="my-4 border-line" />
        <ul className="space-y-1">
          {secondary.map((it) => (
            <NavItem key={it.label} it={it} path={path} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
          <li>
            <form action={logout}>
              <button className={clsx("flex w-full items-center gap-3.5 rounded-xl px-4 py-2.5 text-[15px] text-slate-600 transition hover:bg-slate-50 hover:text-ink", collapsed && "justify-center px-0")} title="Salir">
                <LogOut className="h-[22px] w-[22px] shrink-0" strokeWidth={1.6} />
                {!collapsed && "Salir"}
              </button>
            </form>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

function NavItem({ it, path, collapsed, onNavigate }: { it: Item; path: string; collapsed: boolean; onNavigate?: () => void }) {
  const childActive = it.children?.some((c) => path === c.href || (c.href !== "/web" && path.startsWith(c.href + "/")));
  const [open, setOpen] = useState(!!childActive);
  const active = it.href ? path === it.href || path.startsWith(it.href + "/") : childActive;
  const Icon = it.icon;
  const base = clsx(
    "group flex w-full items-center gap-3.5 rounded-xl px-4 py-2.5 text-[15px] transition",
    active ? "bg-brand-50 font-medium text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-ink",
    collapsed && "justify-center px-0",
  );
  const inner = (
    <>
      <span className="relative">
        <Icon className="h-[22px] w-[22px] shrink-0" strokeWidth={1.6} />
        {collapsed && !!it.badge && <span className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 rounded-full bg-orange-500" />}
      </span>
      {!collapsed && <span className="flex-1 text-left">{it.label}</span>}
      {!collapsed && !!it.badge && <span className="rounded-md bg-orange-500/90 px-2 py-0.5 text-xs font-semibold text-white">{it.badge}</span>}
      {!collapsed && it.children && <ChevronRight className={clsx("h-4 w-4 transition", open && "rotate-90")} />}
    </>
  );
  if (it.children) {
    return (
      <li>
        <button type="button" className={base} onClick={() => setOpen(!open)} title={it.label}>
          {inner}
        </button>
        {open && !collapsed && (
          <ul className="mt-1 mb-2 ml-[30px] space-y-0.5 border-l border-line pl-4">
            {it.children.map((c) => {
              const a = path === c.href;
              return (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    onClick={onNavigate}
                    target={c.href === "/web" ? "_blank" : undefined}
                    className={clsx("block rounded-lg px-3 py-1.5 text-sm transition", a ? "font-medium text-brand-700" : "text-slate-500 hover:text-ink")}
                  >
                    {c.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {open && collapsed && (
          <ul className="mt-1 space-y-0.5">
            {it.children.map((c) => (
              <li key={c.href}>
                <Link href={c.href} onClick={onNavigate} className="block truncate rounded-lg px-1 py-1 text-center text-[10px] text-slate-500 hover:text-ink" title={c.label}>
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }
  return (
    <li>
      <Link href={it.href!} className={base} onClick={onNavigate} title={it.label}>
        {inner}
      </Link>
    </li>
  );
}
