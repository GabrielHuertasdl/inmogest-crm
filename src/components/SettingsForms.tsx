"use client";

import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { MapPicker } from "@/components/maps";
import { saveAgency, saveWebsite } from "@/app/(app)/ajustes/actions";
import { saveSeries } from "@/app/(app)/facturas/actions";
import type { Agency } from "@/db/schema";

const v = (x: unknown) => (x == null ? "" : String(x));

export function AgencyForm({ a, disabled }: { a: Agency; disabled: boolean }) {
  return (
    <ActionForm action={saveAgency} refresh className="space-y-6">
      {(fe) => (
        <fieldset disabled={disabled} className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Datos fiscales y de contacto</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Nombre comercial *" error={fe.name}>
                <input name="name" defaultValue={v(a.name)} className="input" required />
              </Field>
              <Field label="Razón social">
                <input name="legalName" defaultValue={v(a.legalName)} className="input" />
              </Field>
              <Field label="CIF">
                <input name="cif" defaultValue={v(a.cif)} className="input" />
              </Field>
              <Field label="Email" error={fe.email}>
                <input name="email" type="email" defaultValue={v(a.email)} className="input" />
              </Field>
              <Field label="Teléfono">
                <input name="phone" defaultValue={v(a.phone)} className="input" />
              </Field>
              <Field label="IVA por defecto (%)">
                <input name="defaultVat" type="number" min={0} max={100} step="0.01" defaultValue={v(a.defaultVat)} className="input" />
              </Field>
              <Field label="Dirección" className="lg:col-span-2">
                <input name="address" defaultValue={v(a.address)} className="input" />
              </Field>
              <Field label="Código postal">
                <input name="postalCode" defaultValue={v(a.postalCode)} className="input" />
              </Field>
              <Field label="Población">
                <input name="city" defaultValue={v(a.city)} className="input" />
              </Field>
              <Field label="Provincia">
                <input name="province" defaultValue={v(a.province)} className="input" />
              </Field>
            </div>
          </section>
          <section className="card p-6">
            <h2 className="mb-1 text-lg font-semibold">Ubicación de la oficina</h2>
            <p className="mb-4 text-sm text-muted">Se muestra en la página web y centra los mapas del CRM.</p>
            <MapPicker lat={a.lat} lng={a.lng} />
          </section>
          {!disabled && (
            <div className="flex justify-end">
              <SubmitButton>Guardar</SubmitButton>
            </div>
          )}
        </fieldset>
      )}
    </ActionForm>
  );
}

export function WebsiteForm({ a }: { a: Agency }) {
  return (
    <ActionForm action={saveWebsite} refresh className="space-y-6">
      {(fe) => (
        <>
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Contenido</h2>
            <div className="grid gap-4">
              <Field label="Título de la portada">
                <input name="websiteTitle" defaultValue={v(a.websiteTitle)} className="input" placeholder="Encuentra tu hogar" />
              </Field>
              <Field label="Subtítulo">
                <input name="websiteTagline" defaultValue={v(a.websiteTagline)} className="input" />
              </Field>
              <Field label="Texto «Quiénes somos»">
                <textarea name="aboutText" rows={6} defaultValue={v(a.aboutText)} className="input" />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="showCheapest" defaultChecked={a.showCheapest} className="h-4 w-4 accent-brand-600" /> Mostrar las propiedades más económicas en la portada
              </label>
            </div>
          </section>
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Imagen de marca</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <span className="label">Logo</span>
                {a.logoPath && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/files/${a.logoPath}`} alt="Logo" className="mb-2 h-14 w-auto rounded border border-line bg-white p-1" />
                )}
                <input name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="text-sm" />
                {a.logoPath && (
                  <label className="mt-2 flex items-center gap-2 text-xs">
                    <input type="checkbox" name="removeLogo" className="accent-brand-600" /> Quitar logo
                  </label>
                )}
              </div>
              <Field label="Color principal" error={fe.primaryColor}>
                <input name="primaryColor" type="color" defaultValue={a.primaryColor} className="h-11 w-24 cursor-pointer rounded-lg border border-line" />
              </Field>
              <Field label="Color de acento" error={fe.accentColor}>
                <input name="accentColor" type="color" defaultValue={a.accentColor} className="h-11 w-24 cursor-pointer rounded-lg border border-line" />
              </Field>
            </div>
          </section>
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Redes sociales</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["facebook", "instagram", "linkedin", "x"] as const).map((k) => (
                <Field key={k} label={k === "x" ? "X (Twitter)" : k[0]!.toUpperCase() + k.slice(1)} error={fe[k]}>
                  <input name={k} type="url" defaultValue={v(a[k])} className="input" placeholder="https://" />
                </Field>
              ))}
            </div>
          </section>
          <div className="flex justify-end gap-2">
            <a href="/web" target="_blank" className="btn-secondary">
              Ver página web
            </a>
            <SubmitButton>Guardar</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function SeriesForm({ s }: { s?: { id: number; code: string; description: string | null; nextNumber: number; isDefault: boolean } }) {
  return (
    <ActionForm action={saveSeries} refresh resetOnSuccess={!s} className="grid items-end gap-3 sm:grid-cols-[100px_1fr_120px_auto_auto]">
      {(fe) => (
        <>
          {s && <input type="hidden" name="id" value={s.id} />}
          <Field label="Código" error={fe.code}>
            <input name="code" defaultValue={s?.code ?? ""} className="input uppercase" maxLength={6} required />
          </Field>
          <Field label="Descripción">
            <input name="description" defaultValue={s?.description ?? ""} className="input" />
          </Field>
          <Field label="Próximo nº">
            <input name="nextNumber" type="number" min={1} defaultValue={s?.nextNumber ?? 1} className="input" />
          </Field>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" name="isDefault" defaultChecked={s?.isDefault} className="h-4 w-4 accent-brand-600" /> Por defecto
          </label>
          <SubmitButton className="btn-secondary">{s ? "Guardar" : "Añadir"}</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
