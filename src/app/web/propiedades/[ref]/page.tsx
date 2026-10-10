import { notFound } from "next/navigation";
import Link from "next/link";
import { BedDouble, Bath, Ruler, MapPin, Check, Phone, Mail } from "lucide-react";
import { publicByRef, publicAgency } from "@/lib/queries/public";
import { FavButton, Gallery, ContactForm, MortgageCalculator } from "@/components/web/client";
import { MapView } from "@/components/maps";
import { CONDITIONS, FEATURES, OPERATIONS, PROPERTY_TYPES } from "@/lib/constants";
import { euros } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ ref: string }> }) {
  const p = publicByRef((await params).ref);
  return p ? { title: `${p.title} · ${euros(p.price)}`, description: p.description?.slice(0, 160) } : { title: "Inmueble no disponible" };
}

export default async function WebProperty({ params }: { params: Promise<{ ref: string }> }) {
  const p = publicByRef((await params).ref);
  if (!p) notFound();
  const a = publicAgency();
  const facts = [
    ["Tipo", PROPERTY_TYPES[p.type]],
    ["Sup. construida", p.areaBuilt && `${p.areaBuilt} m²`],
    ["Sup. útil", p.areaUseful && `${p.areaUseful} m²`],
    ["Parcela", p.plotArea && `${p.plotArea} m²`],
    ["Habitaciones", p.rooms],
    ["Baños", p.baths],
    ["Planta", p.floor],
    ["Año de construcción", p.yearBuilt],
    ["Estado", CONDITIONS[p.condition]],
    ["Certificado energético", p.energyRating],
    ["Gastos de comunidad", p.communityFee && `${euros(p.communityFee)}/mes`],
  ].filter(([, v]) => v != null && v !== "") as [string, string | number][];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/web" className="hover:text-slate-800">Inicio</Link> / <Link href={`/web/propiedades?operation=${p.operation}`} className="hover:text-slate-800">{OPERATIONS[p.operation]}</Link> / <span>{p.ref}</span>
      </nav>
      <Gallery photos={p.photos} title={p.title} />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{p.title}</h1>
              <p className="mt-2 flex items-center gap-1 text-slate-500">
                <MapPin className="h-4 w-4" /> {[p.address, p.zone, p.city].filter(Boolean).join(", ")}
              </p>
            </div>
            <FavButton refCode={p.ref} className="ring-1 ring-slate-200" />
          </div>
          <div className="flex flex-wrap items-center gap-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <p className="text-3xl font-bold text-[var(--brand)]">
              {euros(p.price)}
              {p.operation === "alquiler" && <span className="text-base font-normal text-slate-500">/mes</span>}
            </p>
            <div className="flex gap-6 text-slate-600">
              {p.rooms != null && (
                <span className="flex items-center gap-2">
                  <BedDouble className="h-5 w-5" /> {p.rooms} hab.
                </span>
              )}
              {p.baths != null && (
                <span className="flex items-center gap-2">
                  <Bath className="h-5 w-5" /> {p.baths} baños
                </span>
              )}
              {p.areaBuilt != null && (
                <span className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" /> {p.areaBuilt} m²
                </span>
              )}
            </div>
            {p.status === "reservado" && <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">Reservado</span>}
          </div>
          {p.description && (
            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">Descripción</h2>
              <p className="leading-relaxed whitespace-pre-line text-slate-700">{p.description}</p>
            </section>
          )}
          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-900">Características</h2>
            <dl className="grid gap-x-8 gap-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:grid-cols-2">
              {facts.map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-slate-100 pb-2 text-sm">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {p.features.length > 0 && (
              <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-[var(--brand)]" /> {FEATURES[f] ?? f}
                  </li>
                ))}
              </ul>
            )}
          </section>
          {p.lat != null && p.lng != null && (
            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">Ubicación</h2>
              <MapView center={[p.lat, p.lng]} zoom={15} pins={[{ id: p.id, lat: p.lat, lng: p.lng, color: a.primaryColor }]} approx={!p.showExactLocation} height={360} />
              {!p.showExactLocation && <p className="mt-2 text-xs text-slate-500">Ubicación aproximada.</p>}
            </section>
          )}
          {p.operation === "venta" && (
            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">Calcula tu hipoteca</h2>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <MortgageCalculator price={p.price} />
              </div>
            </section>
          )}
        </div>
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <p className="mb-1 text-lg font-bold text-slate-900">¿Te interesa?</p>
            <p className="mb-4 text-sm text-slate-500">Referencia {p.ref}</p>
            {p.agent && (
              <div className="mb-5 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                {p.agent.avatarPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/files/${p.agent.avatarPath}`} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-full font-semibold text-white" style={{ background: p.agent.color }}>
                    {p.agent.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                )}
                <div className="text-sm">
                  <p className="font-semibold">{p.agent.name}</p>
                  {(p.agent.phone ?? a.phone) && (
                    <a href={`tel:${(p.agent.phone ?? a.phone)!.replace(/\s/g, "")}`} className="flex items-center gap-1 text-[var(--brand)]">
                      <Phone className="h-3.5 w-3.5" /> {p.agent.phone ?? a.phone}
                    </a>
                  )}
                  {a.email && (
                    <a href={`mailto:${a.email}`} className="flex items-center gap-1 text-slate-500">
                      <Mail className="h-3.5 w-3.5" /> {a.email}
                    </a>
                  )}
                </div>
              </div>
            )}
            <ContactForm propertyRef={p.ref} compact />
          </div>
        </aside>
      </div>
    </div>
  );
}
