import { MortgageCalculator } from "@/components/web/client";

export const metadata = { title: "Simulador de hipoteca" };

export default function Mortgage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold text-slate-900">Simulador de hipoteca</h1>
      <p className="mb-8 text-slate-500">Calcula la cuota mensual aproximada y el ahorro que necesitas para comprar tu vivienda.</p>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
        <MortgageCalculator />
      </div>
    </div>
  );
}
