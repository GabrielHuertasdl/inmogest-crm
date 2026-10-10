import Link from "next/link";
import { ArrowRight, ShieldCheck, Handshake, Calculator } from "lucide-react";
import { publicAgency, publicCities, publicHome, type PublicProperty } from "@/lib/queries/public";
import { PublicCard } from "@/components/web/PublicCard";
import { SearchBox } from "@/components/web/SearchBox";

export default function WebHome() {
  const a = publicAgency();
  const { latest, cheapest, featured } = publicHome();
  const cities = publicCities();
  return (
    <>
      <section className="relative overflow-hidden bg-[var(--brand)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.18),transparent_45%),radial-gradient(circle_at_85%_70%,rgba(0,0,0,.25),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-28 sm:px-6">
          <h1 className="max-w-3xl text-4xl leading-tight font-bold text-white sm:text-5xl">{a.websiteTitle ?? a.name}</h1>
          {a.websiteTagline && <p className="mt-4 max-w-2xl text-lg text-white/85">{a.websiteTagline}</p>}
          <div className="mt-10">
            <SearchBox cities={cities} />
          </div>
        </div>
      </section>
      <Section title="Propiedades destacadas" href="/web/propiedades" items={featured} />
      <Section title="Últimas propiedades" href="/web/propiedades" items={latest} />
      {a.showCheapest && <Section title="Las más económicas" href="/web/propiedades?operation=venta&sort=precio_asc" items={cheapest} />}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            [ShieldCheck, "Asesoramiento integral", "Te acompañamos en la búsqueda, la negociación, la financiación y la firma."],
            [Handshake, "¿Quieres vender?", "Valoramos tu vivienda gratis y la publicamos en los principales portales."],
            [Calculator, "Calcula tu hipoteca", "Descubre en segundos cuánto pagarías al mes."],
          ].map(([Icon, t, d], i) => {
            const I = Icon as typeof ShieldCheck;
            return (
              <Link key={i} href={i === 2 ? "/web/hipoteca" : "/web/contacto"} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
                <I className="h-8 w-8 text-[var(--brand)]" />
                <p className="mt-4 text-lg font-semibold text-slate-900">{t as string}</p>
                <p className="mt-1 text-sm text-slate-500">{d as string}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

function Section({ title, href, items }: { title: string; href: string; items: PublicProperty[] }) {
  return (
    items.length ? (
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
          <Link href={href} className="flex items-center gap-1 text-sm font-semibold text-[var(--brand)] hover:underline">
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <PublicCard key={p.id} p={p} />
          ))}
        </div>
      </section>
    ) : null
  );
}
