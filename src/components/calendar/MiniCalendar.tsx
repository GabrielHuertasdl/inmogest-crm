"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { EVENT_COLORS } from "@/lib/constants";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function MiniCalendar({ initial, today, agent }: { initial: { y: number; m: number; days: Record<string, string[]> }; today: string; agent: string }) {
  const [state, setState] = useState(initial);
  const [loading, setLoading] = useState(false);
  const go = async (delta: number) => {
    let { y, m } = state;
    m += delta;
    if (m < 1) {
      m = 12;
      y--;
    }
    if (m > 12) {
      m = 1;
      y++;
    }
    setLoading(true);
    const r = await fetch(`/api/calendario/dias?y=${y}&m=${m}&agent=${agent}`).then((r) => r.json());
    setState({ y, m, days: r.days ?? {} });
    setLoading(false);
  };
  const first = new Date(Date.UTC(state.y, state.m - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const daysIn = new Date(Date.UTC(state.y, state.m, 0)).getUTCDate();
  const prevDays = new Date(Date.UTC(state.y, state.m - 1, 0)).getUTCDate();
  const cells: { d: number; cur: boolean; key?: string }[] = [];
  for (let i = offset - 1; i >= 0; i--) cells.push({ d: prevDays - i, cur: false });
  for (let d = 1; d <= daysIn; d++) cells.push({ d, cur: true, key: `${state.y}-${String(state.m).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  while (cells.length % 7) cells.push({ d: cells.length - offset - daysIn + 1, cur: false });
  return (
    <div className={clsx(loading && "opacity-60")}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Calendario</h3>
        <div className="flex items-center gap-1 rounded-lg bg-brand-50 px-1 py-1 text-sm text-ink">
          <button onClick={() => go(-1)} className="rounded p-1 hover:bg-white" aria-label="Mes anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="w-24 text-center text-[13px]">
            {MONTHS[state.m - 1]} {state.y !== Number(today.slice(0, 4)) ? state.y : ""}
          </span>
          <button onClick={() => go(1)} className="rounded p-1 hover:bg-white" aria-label="Mes siguiente">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
        {DOW.map((d) => (
          <div key={d} className="pb-2 text-xs text-muted">
            {d}
          </div>
        ))}
        {cells.map((c, i) => {
          const kinds = c.key ? state.days[c.key] : undefined;
          const isToday = c.key === today;
          return (
            <div key={i} className="grid place-items-center">
              {c.cur ? (
                <Link
                  href={`/calendario?view=day&date=${c.key}`}
                  className={clsx("relative grid h-9 w-9 place-items-center rounded-full transition", isToday ? "bg-brand-600 font-semibold text-white" : kinds ? "bg-brand-50 font-medium text-brand-700 hover:bg-brand-100" : "hover:bg-slate-100")}
                  title={kinds ? `${kinds.length} evento(s)` : undefined}
                >
                  {c.d}
                  {kinds && <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full ring-2 ring-white" style={{ background: EVENT_COLORS[kinds[0]!] ?? "#f59e0b" }} />}
                </Link>
              ) : (
                <span className="grid h-9 w-9 place-items-center text-slate-300">{c.d}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-center">
        <Link href="/calendario" className="text-sm font-medium text-brand-600 hover:underline">
          Ver el calendario
        </Link>
      </div>
    </div>
  );
}
