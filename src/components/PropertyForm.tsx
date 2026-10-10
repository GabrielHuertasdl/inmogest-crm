"use client";

import { useState } from "react";
import { Sparkles, Loader2, ImagePlus } from "lucide-react";
import { ActionForm, SubmitButton, alertToast } from "@/components/forms";
import { Field, Select } from "@/components/ui";
import { MapPicker } from "@/components/maps";
import { saveProperty } from "@/app/(app)/propiedades/actions";
import { CONDITIONS, ENERGY, FEATURES, OPERATIONS, PROPERTY_STATUS, PROPERTY_TYPES } from "@/lib/constants";

export type PropertyFormValues = {
  id?: number;
  title?: string;
  operation?: string;
  type?: string;
  status?: string;
  price?: number;
  communityFee?: number | null;
  areaBuilt?: number | null;
  areaUseful?: number | null;
  plotArea?: number | null;
  rooms?: number | null;
  baths?: number | null;
  floor?: string | null;
  yearBuilt?: number | null;
  energyRating?: string | null;
  condition?: string;
  address?: string | null;
  city?: string | null;
  zone?: string | null;
  province?: string | null;
  postalCode?: string | null;
  lat?: number | null;
  lng?: number | null;
  showExactLocation?: boolean;
  description?: string | null;
  descriptionEn?: string | null;
  featureList?: string[];
  portalIds?: number[];
  agentId?: number | null;
  ownerClientId?: number | null;
  isShared?: boolean;
  sharedCommissionPct?: number | null;
  commissionPct?: number;
  featured?: boolean;
  publishedWeb?: boolean;
  closedPrice?: number | null;
  leadId?: number | null;
};

const v = (x: unknown) => (x == null ? "" : String(x));

export function PropertyForm({
  initial,
  agents,
  clients,
  portals,
  isAdmin,
  defaultCenter,
}: {
  initial: PropertyFormValues;
  agents: { value: number; label: string }[];
  clients: { id: number; label: string; kind: string }[];
  portals: { id: number; name: string; enabled: boolean }[];
  isAdmin: boolean;
  defaultCenter: [number, number];
}) {
  const [desc, setDesc] = useState(initial.description ?? "");
  const [descEn, setDescEn] = useState(initial.descriptionEn ?? "");
  const [gen, setGen] = useState<"" | "es" | "en">("");
  const [status, setStatus] = useState(initial.status ?? "disponible");
  const [shared, setShared] = useState(!!initial.isShared);
  const [files, setFiles] = useState<File[]>([]);
  const [address, setAddress] = useState({ address: v(initial.address), city: v(initial.city), postalCode: v(initial.postalCode) });
  const [geo, setGeo] = useState<{ lat: number | null; lng: number | null; key: number }>({ lat: initial.lat ?? null, lng: initial.lng ?? null, key: 0 });
  const [geocoding, setGeocoding] = useState(false);

  async function generate(form: HTMLFormElement, lang: "es" | "en") {
    setGen(lang);
    const fd = new FormData(form);
    const body = {
      lang,
      type: fd.get("type"),
      operation: fd.get("operation"),
      city: fd.get("city"),
      zone: fd.get("zone"),
      areaBuilt: Number(fd.get("areaBuilt")) || null,
      rooms: fd.get("rooms") === "" ? null : Number(fd.get("rooms")),
      baths: Number(fd.get("baths")) || null,
      floor: fd.get("floor"),
      condition: fd.get("condition"),
      features: fd.getAll("features[]"),
      price: Number(fd.get("price")) || null,
      title: fd.get("title"),
    };
    try {
      const r = await fetch("/api/ia/descripcion", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
      if (r.text) {
        if (lang === "es") setDesc(r.text);
        else setDescEn(r.text);
        alertToast(r.source === "ia" ? "Descripción generada con IA" : "Descripción generada con plantilla (configura ANTHROPIC_API_KEY para usar IA)", "ok");
      } else alertToast(r.error ?? "No se pudo generar");
    } finally {
      setGen("");
    }
  }

  async function geocode() {
    const q = [address.address, address.postalCode, address.city, "España"].filter(Boolean).join(", ");
    if (!address.address && !address.city) return alertToast("Introduce dirección o ciudad");
    setGeocoding(true);
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`).then((r) => r.json());
      if (r.lat) setGeo({ lat: r.lat, lng: r.lng, key: Date.now() });
      else alertToast("No se ha encontrado la dirección. Sitúala en el mapa manualmente.");
    } finally {
      setGeocoding(false);
    }
  }

  return (
    <ActionForm action={saveProperty} className="space-y-6">
      {(fe) => (
        <>
          {initial.id && <input type="hidden" name="id" value={initial.id} />}
          {initial.leadId && <input type="hidden" name="leadId" value={initial.leadId} />}

          <Section title="Operación y precio">
            <Field label="Título del anuncio *" error={fe.title} className="sm:col-span-2 lg:col-span-4">
              <input name="title" defaultValue={v(initial.title)} className="input" placeholder="Ej. Piso luminoso con terraza en Ruzafa" required />
            </Field>
            <Field label="Operación *">
              <Select name="operation" defaultValue={initial.operation ?? "venta"} options={OPERATIONS} />
            </Field>
            <Field label="Tipo de inmueble *">
              <Select name="type" defaultValue={initial.type ?? "piso"} options={PROPERTY_TYPES} />
            </Field>
            <Field label="Estado">
              <Select name="status" value={status} onChange={(e) => setStatus(e.target.value)} options={PROPERTY_STATUS} />
            </Field>
            <Field label="Precio (€) *" error={fe.price}>
              <input name="price" type="number" min={0} step={1} defaultValue={v(initial.price)} className="input" required />
            </Field>
            {(status === "vendido" || status === "alquilado") && (
              <Field label={status === "vendido" ? "Precio final de venta (€)" : "Renta final (€/mes)"} hint="Se usa para las estadísticas de ingresos">
                <input name="closedPrice" type="number" min={0} defaultValue={v(initial.closedPrice ?? initial.price)} className="input" />
              </Field>
            )}
            <Field label="Gastos de comunidad (€/mes)">
              <input name="communityFee" type="number" min={0} defaultValue={v(initial.communityFee)} className="input" />
            </Field>
            <Field label="Honorarios (%)" hint="En alquiler, % de una mensualidad">
              <input name="commissionPct" type="number" min={0} max={100} step={0.5} defaultValue={v(initial.commissionPct ?? 3)} className="input" />
            </Field>
          </Section>

          <Section title="Características">
            <Field label="Superficie construida (m²)">
              <input name="areaBuilt" type="number" min={0} defaultValue={v(initial.areaBuilt)} className="input" />
            </Field>
            <Field label="Superficie útil (m²)">
              <input name="areaUseful" type="number" min={0} defaultValue={v(initial.areaUseful)} className="input" />
            </Field>
            <Field label="Parcela (m²)">
              <input name="plotArea" type="number" min={0} defaultValue={v(initial.plotArea)} className="input" />
            </Field>
            <Field label="Habitaciones">
              <input name="rooms" type="number" min={0} max={50} defaultValue={v(initial.rooms)} className="input" />
            </Field>
            <Field label="Baños">
              <input name="baths" type="number" min={0} max={20} defaultValue={v(initial.baths)} className="input" />
            </Field>
            <Field label="Planta">
              <input name="floor" defaultValue={v(initial.floor)} className="input" placeholder="Bajo, 1, 2, Ático…" />
            </Field>
            <Field label="Año de construcción" error={fe.yearBuilt}>
              <input name="yearBuilt" type="number" min={1700} max={2100} defaultValue={v(initial.yearBuilt)} className="input" />
            </Field>
            <Field label="Certificado energético">
              <Select name="energyRating" defaultValue={v(initial.energyRating)} options={ENERGY.map((e) => ({ value: e, label: e }))} placeholder="Sin especificar" />
            </Field>
            <Field label="Estado de conservación">
              <Select name="condition" defaultValue={initial.condition ?? "buen_estado"} options={CONDITIONS} />
            </Field>
          </Section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Extras</h2>
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(FEATURES).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="features[]" value={k} defaultChecked={initial.featureList?.includes(k)} className="h-4 w-4 rounded accent-brand-600" />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Ubicación</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="grid content-start gap-4 sm:grid-cols-2">
                <Field label="Dirección" className="sm:col-span-2">
                  <input name="address" value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} className="input" placeholder="Calle y número" />
                </Field>
                <Field label="Población">
                  <input name="city" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="input" />
                </Field>
                <Field label="Zona / barrio">
                  <input name="zone" defaultValue={v(initial.zone)} className="input" />
                </Field>
                <Field label="Provincia">
                  <input name="province" defaultValue={v(initial.province)} className="input" />
                </Field>
                <Field label="Código postal">
                  <input name="postalCode" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} className="input" />
                </Field>
                <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                  <button type="button" onClick={geocode} className="btn-secondary btn-sm" disabled={geocoding}>
                    {geocoding && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Localizar dirección en el mapa
                  </button>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="showExactLocation" defaultChecked={initial.showExactLocation} className="h-4 w-4 accent-brand-600" />
                    Mostrar ubicación exacta en la web
                  </label>
                </div>
              </div>
              <MapPicker key={geo.key} lat={geo.lat} lng={geo.lng} defaultCenter={defaultCenter} onChange={(lat, lng) => setGeo((g) => ({ ...g, lat, lng }))} />
            </div>
          </section>

          <section className="card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Descripción</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="label mb-0">Español</span>
                  <button type="button" onClick={(e) => generate(e.currentTarget.form!, "es")} className="btn-ghost btn-sm text-brand-600" disabled={!!gen}>
                    {gen === "es" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Generar con IA
                  </button>
                </div>
                <textarea name="description" rows={10} value={desc} onChange={(e) => setDesc(e.target.value)} className="input" />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="label mb-0">Inglés</span>
                  <button type="button" onClick={(e) => generate(e.currentTarget.form!, "en")} className="btn-ghost btn-sm text-brand-600" disabled={!!gen}>
                    {gen === "en" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Generar con IA
                  </button>
                </div>
                <textarea name="descriptionEn" rows={10} value={descEn} onChange={(e) => setDescEn(e.target.value)} className="input" />
              </div>
            </div>
          </section>

          {!initial.id && (
            <section className="card p-6">
              <h2 className="mb-4 text-lg font-semibold">Fotos</h2>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line px-6 py-10 text-center hover:border-brand-400 hover:bg-brand-50/30">
                <ImagePlus className="h-8 w-8 text-brand-500" />
                <span className="text-sm font-medium">Haz clic para seleccionar fotos</span>
                <span className="text-xs text-muted">JPG, PNG o WEBP · máx. 10 MB cada una · la primera será la portada</span>
                <input type="file" name="photos" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
              </label>
              {files.length > 0 && <p className="mt-2 text-sm text-muted">{files.length} archivo(s) seleccionados</p>}
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-6">
              <h2 className="mb-4 text-lg font-semibold">Gestión</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Agente responsable">
                  <Select name="agentId" defaultValue={v(initial.agentId)} options={agents} disabled={!isAdmin} />
                </Field>
                <Field label="Propietario (cliente)">
                  <Select name="ownerClientId" defaultValue={v(initial.ownerClientId)} options={clients.map((c) => ({ value: c.id, label: c.label }))} placeholder="— Sin propietario —" />
                </Field>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" name="publishedWeb" defaultChecked={initial.publishedWeb ?? true} className="h-4 w-4 accent-brand-600" />
                  Publicar en mi página web
                </label>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" name="featured" defaultChecked={initial.featured} className="h-4 w-4 accent-brand-600" />
                  Destacada en la página web
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isShared" checked={shared} onChange={(e) => setShared(e.target.checked)} className="h-4 w-4 accent-brand-600" />
                  Compartir con otros agentes / agencias
                </label>
                {shared && (
                  <Field label="Honorarios compartidos (%)">
                    <input name="sharedCommissionPct" type="number" min={0} max={100} defaultValue={v(initial.sharedCommissionPct ?? 50)} className="input" />
                  </Field>
                )}
              </div>
            </section>
            <section className="card p-6">
              <h2 className="mb-1 text-lg font-semibold">Portales inmobiliarios</h2>
              <p className="mb-4 text-sm text-muted">Marca los portales en los que quieres publicar este inmueble.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {portals.map((p) => (
                  <label key={p.id} className={`flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm ${!p.enabled ? "opacity-50" : ""}`} title={!p.enabled ? "Portal desactivado en Portales inmobiliarios" : undefined}>
                    <input type="checkbox" name="portals[]" value={p.id} defaultChecked={initial.portalIds?.includes(p.id)} disabled={!p.enabled} className="h-4 w-4 accent-brand-600" />
                    {p.name}
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-line bg-canvas/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
            <a href={initial.id ? `/propiedades/${initial.id}` : "/propiedades"} className="btn-secondary">
              Cancelar
            </a>
            <SubmitButton>{initial.id ? "Guardar cambios" : "Crear propiedad"}</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}
