"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useState } from "react";
import { List, LineChart as LineIcon } from "lucide-react";
import clsx from "clsx";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const mLabel = (k: string) => MONTHS[Number(k.slice(5, 7)) - 1] + (k.slice(0, 4) !== String(new Date().getFullYear()) ? ` ${k.slice(2, 4)}` : "");
const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function CaptacionesChart({ data, agents, perAgent }: { data: Record<string, number | string>[]; agents: { id: number; name: string; color: string }[]; perAgent: { id: number; name: string; color: string; total: number }[] }) {
  const [view, setView] = useState<"chart" | "list">("chart");
  return (
    <div>
      <div className="-mt-12 mb-4 flex justify-end">
        <div className="flex rounded-lg bg-slate-100 p-1">
          {(["list", "chart"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={clsx("rounded-md px-2.5 py-1.5", view === v ? "bg-white shadow-sm" : "text-slate-500")} aria-label={v === "list" ? "Lista" : "Gráfico"}>
              {v === "list" ? <List className="h-4 w-4" /> : <LineIcon className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>
      {view === "chart" ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e8ebf2" />
              <XAxis dataKey="month" tickFormatter={mLabel} tick={{ fontSize: 11, fill: "#8a93a6" }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={40} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8a93a6" }} axisLine={false} tickLine={false} />
              <Tooltip labelFormatter={(l) => mLabel(String(l))} contentStyle={{ borderRadius: 12, border: "1px solid #e8ebf2", fontSize: 12 }} />
              {agents.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
              {agents.length > 1 ? (
                agents.map((a) => <Line key={a.id} type="monotone" dataKey={`a${a.id}`} name={a.name} stroke={a.color} strokeWidth={2.5} dot={false} />)
              ) : (
                <Line type="monotone" dataKey="total" name="Captaciones" stroke="#3463e6" strokeWidth={3} dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {perAgent.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-3">
              <span className="h-3 w-3 rounded-full" style={{ background: a.color }} />
              <span className="flex-1 text-sm">{a.name}</span>
              <span className="text-sm font-semibold">{a.total}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function IncomeChart({ data }: { data: { month: string; estimado: number; facturado: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gEst" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3463e6" stopOpacity={0.35} />
              <stop offset="1" stopColor="#3463e6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gFac" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#16a34a" stopOpacity={0.3} />
              <stop offset="1" stopColor="#16a34a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e8ebf2" />
          <XAxis dataKey="month" tickFormatter={mLabel} tick={{ fontSize: 11, fill: "#8a93a6" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} tick={{ fontSize: 11, fill: "#8a93a6" }} axisLine={false} tickLine={false} width={44} />
          <Tooltip formatter={(v) => eur.format(Number(v))} labelFormatter={(l) => mLabel(String(l))} contentStyle={{ borderRadius: 12, border: "1px solid #e8ebf2", fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="estimado" name="Estimado operaciones" stroke="#3463e6" strokeWidth={2.5} fill="url(#gEst)" />
          <Area type="monotone" dataKey="facturado" name="Facturado" stroke="#16a34a" strokeWidth={2.5} fill="url(#gFac)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleBars({ data, color = "#3463e6", money }: { data: { label: string; value: number }[]; color?: string; money?: boolean }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e8ebf2" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8a93a6" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => (money && v >= 1000 ? `${Math.round(v / 1000)}k` : v)} tick={{ fontSize: 11, fill: "#8a93a6" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip formatter={(v) => (money ? eur.format(Number(v)) : v)} contentStyle={{ borderRadius: 12, border: "1px solid #e8ebf2", fontSize: 12 }} />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export { mLabel };
