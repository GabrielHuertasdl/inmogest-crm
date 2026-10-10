"use client";

import { useState } from "react";
import clsx from "clsx";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Reminders } from "./Reminders";

export type ShellUser = { id: number; name: string; email: string; role: string; color: string; avatarPath: string | null };

export function AppShell({ user, collapsed: initial, unread, todayEvents, children }: { user: ShellUser; collapsed: boolean; unread: number; todayEvents: number; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(initial);
  const [mobile, setMobile] = useState(false);
  const toggle = () => {
    if (window.matchMedia("(max-width: 1023px)").matches) return setMobile((m) => !m);
    const v = !collapsed;
    setCollapsed(v);
    document.cookie = `ig_sidebar=${v ? 1 : 0}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <div className="flex h-dvh overflow-hidden">
      <Reminders />
      <div className={clsx("no-print hidden shrink-0 border-r border-line lg:block")}>
        <Sidebar collapsed={collapsed} unread={unread} todayEvents={todayEvents} isAdmin={user.role === "admin"} />
      </div>
      {mobile && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobile(false)} />
          <div className="absolute inset-y-0 left-0 shadow-xl">
            <Sidebar collapsed={false} unread={unread} todayEvents={todayEvents} isAdmin={user.role === "admin"} onNavigate={() => setMobile(false)} />
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} unread={unread} todayEvents={todayEvents} onToggle={toggle} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
