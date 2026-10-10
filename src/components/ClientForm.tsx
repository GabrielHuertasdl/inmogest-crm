"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Select } from "@/components/ui";
import { saveClient } from "@/app/(app)/clientes/actions";
import { CLIENT_KINDS, CLIENT_SOURCES, CLIENT_STATUS, FEATURES, OPERATIONS, PROPERTY_TYPES } from "@/lib/constants";

export type ClientFormValues = {
  id?: number;
  name?: string;
  surname?: string | null;
  email?: string | null;
  phone?: string | null;
  phone2?: string | null;
  dni?: string | null;
  address?: string | null;
  kind?: string;
  source?: string;
  status?: string;
  agentId?: number | null;
  notes?: string | null;
  gdprConsent?: boolean;
  pref?: {
    active: boolean;
    operation: string | null;
    types: string[];
    minPrice: number | null;
    maxPrice: number | null;
    minRooms: number | null;
    minBaths: number | null;
    minArea: number | null;
    zones: string[];
    features: string[];
  } | null;
  conversationId?: number;
};

const v = (x: unknown) => (x == null ? "" : String(x));

export function ClientForm({ initial, agents, isAdmin, zoneSuggestions }: { initial: ClientFormValues; agents: { value: number; label: string }[]; isAdmin: boolean; zoneSuggestions: string[] }) {
  const [kind, setKind] = useState(initial.kind ?? "comprador");
  const pref = initial.pref;
  const wantsPrefs = kind !== "propietario" && kind !== "otro";
  const [prefOn, setPrefOn] = useState(pref ? pref.active : wantsPrefs);

  return (
    <ActionForm action={saveClient} className="space-y-6">
      {(fe) => (
        <>
          {initial.id && <input type="hidden" name="id" value={initial.id} />}
          {initial.conversationId && <input type="hidden" name="conversationId" value={initial.conversationId} />}
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Datos personales</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Nombre *" error={fe.name}>
                <input name="name" defaultValue={v(initial.name)} className="input" required />
              </Field>
              <Field label="Apellidos">
                <input name="surname" defaultValue={v(initial.surname)} className="input" />
              </Field>
              <Field label="Email" error={fe.email}>
                <input name="email" type="email" defaultValue={v(initial.email)} className="input" />
              </Field>
              <Field label="Teléfono" error={fe.phone}>
                <input name="phone" type="tel" defaultValue={v(initial.phone)} className="input" />
              </Field>
              <Field label="Teléfono 2">
                <input name="phone2" type="tel" defaultValue={v(initial.phone2)} className="input" />
              </Field>
              <Field label="DNI / NIE / CIF">
                <input name="dni" defaultValue={v(initial.dni)} className="input" />
              </Field>
              <Field label="Dirección" className="lg:col-span-2">
                <input name="address" defaultValue={v(initial.address)} className="input" />
              </Field>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Clasificación</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Tipo de cliente">
                <Select name="kind" value={kind} onChange={(e) => setKind(e.target.value)} options={CLIENT_KINDS} />
              </Field>
              <Field label="Origen">
                <Select name="source" defaultValue={initial.source ?? "oficina"} options={CLIENT_SOURCES} />
              </Field>
              <Field label="Estado">
                <Select name="status" defaultValue={initial.status ?? "nuevo"} options={CLIENT_STATUS} />
              </Field>
              <Field label="Agente asignado">
                <Select name="agentId" defaultValue={v(initial.agentId)} options={agents} disabled={!isAdmin} />
              </Field>
              <Field label="Notas" className="sm:col-span-2 lg:col-span-4">
                <textarea name="notes" rows={3} defaultValue={v(initial.notes)} className="input" />
              </Field>
              <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-4">
                <input type="checkbox" name="gdprConsent" defaultChecked={initial.gdprConsent} className="h-4 w-4 accent-brand-600" />
                El cliente ha aceptado la política de protección de datos (RGPD)
              </label>
            </div>
          </section>

          <section className="card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Demanda / preferencias</h2>
                <p className="text-sm text-muted">Se usan para los cruces automáticos con propiedades.</p>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="prefActive" checked={prefOn} onChange={(e) => setPrefOn(e.target.checked)} className="h-4 w-4 accent-brand-600" />
                Demanda activa
              </label>
            </div>
            <fieldset disabled={!prefOn} className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${!prefOn ? "opacity-50" : ""}`}>
              <Field label="Operación">
                <Select name="prefOperation" defaultValue={v(pref?.operation ?? (kind === "inquilino" ? "alquiler" : "venta"))} options={OPERATIONS} placeholder="Cualquiera" />
              </Field>
              <Field label="Precio mínimo (€)">
                <input name="prefMinPrice" type="number" min={0} defaultValue={v(pref?.minPrice)} className="input" />
              </Field>
              <Field label="Precio máximo (€)">
                <input name="prefMaxPrice" type="number" min={0} defaultValue={v(pref?.maxPrice)} className="input" />
              </Field>
              <Field label="Superficie mínima (m²)">
                <input name="prefMinArea" type="number" min={0} defaultValue={v(pref?.minArea)} className="input" />
              </Field>
              <Field label="Habitaciones mín.">
                <input name="prefMinRooms" type="number" min={0} defaultValue={v(pref?.minRooms)} className="input" />
              </Field>
              <Field label="Baños mín.">
                <input name="prefMinBaths" type="number" min={0} defaultValue={v(pref?.minBaths)} className="input" />
              </Field>
              <Field label="Zonas / poblaciones" hint="Separadas por comas" className="sm:col-span-2">
                <input name="prefZones" list="zone-suggestions" defaultValue={pref?.zones.join(", ") ?? ""} className="input" placeholder="Ruzafa, Benimaclet, Alboraya…" />
                <datalist id="zone-suggestions">
                  {zoneSuggestions.map((z) => (
                    <option key={z} value={z} />
                  ))}
                </datalist>
              </Field>
              <div className="sm:col-span-2 lg:col-span-4">
                <span className="label">Tipos de inmueble</span>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {Object.entries(PROPERTY_TYPES).map(([k, l]) => (
                    <label key={k} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="prefTypes[]" value={k} defaultChecked={pref?.types.includes(k)} className="h-4 w-4 accent-brand-600" /> {l}
                    </label>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <span className="label">Extras deseados</span>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {Object.entries(FEATURES).map(([k, l]) => (
                    <label key={k} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="prefFeatures[]" value={k} defaultChecked={pref?.features.includes(k)} className="h-4 w-4 accent-brand-600" /> {l}
                    </label>
                  ))}
                </div>
              </div>
            </fieldset>
          </section>

          <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-line bg-canvas/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
            <a href={initial.id ? `/clientes/${initial.id}` : "/clientes"} className="btn-secondary">
              Cancelar
            </a>
            <SubmitButton>{initial.id ? "Guardar cambios" : "Crear cliente"}</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
