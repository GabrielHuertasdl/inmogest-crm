"use client";

import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Select } from "@/components/ui";
import { saveLead } from "@/app/(app)/captaciones/actions";
import { LEAD_STAGES, OPERATIONS, PROPERTY_TYPES } from "@/lib/constants";
import type { Lead } from "@/db/schema";

const v = (x: unknown) => (x == null ? "" : String(x));

export function LeadForm({ initial, agents, isAdmin }: { initial: Partial<Lead>; agents: { value: number; label: string }[]; isAdmin: boolean }) {
  return (
    <ActionForm action={saveLead} className="space-y-6">
      {(fe) => (
        <>
          {initial.id && <input type="hidden" name="id" value={initial.id} />}
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Propietario</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Nombre *" error={fe.ownerName}>
                <input name="ownerName" defaultValue={v(initial.ownerName)} className="input" required />
              </Field>
              <Field label="Teléfono">
                <input name="phone" type="tel" defaultValue={v(initial.phone)} className="input" />
              </Field>
              <Field label="Email" error={fe.email}>
                <input name="email" type="email" defaultValue={v(initial.email)} className="input" />
              </Field>
            </div>
          </section>
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Inmueble a captar</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Dirección" className="sm:col-span-2">
                <input name="address" defaultValue={v(initial.address)} className="input" />
              </Field>
              <Field label="Población">
                <input name="city" defaultValue={v(initial.city)} className="input" />
              </Field>
              <Field label="Zona">
                <input name="zone" defaultValue={v(initial.zone)} className="input" />
              </Field>
              <Field label="Tipo">
                <Select name="type" defaultValue={v(initial.type)} options={PROPERTY_TYPES} placeholder="—" />
              </Field>
              <Field label="Operación">
                <Select name="operation" defaultValue={v(initial.operation ?? "venta")} options={OPERATIONS} />
              </Field>
              <Field label="Precio esperado (€)">
                <input name="expectedPrice" type="number" min={0} defaultValue={v(initial.expectedPrice)} className="input" />
              </Field>
              <Field label="Etapa">
                <Select name="stage" defaultValue={initial.stage ?? "nuevo"} options={LEAD_STAGES} />
              </Field>
              <Field label="Agente">
                <Select name="agentId" defaultValue={v(initial.agentId)} options={agents} disabled={!isAdmin} />
              </Field>
              <Field label="Notas" className="sm:col-span-2 lg:col-span-4">
                <textarea name="notes" rows={4} defaultValue={v(initial.notes)} className="input" />
              </Field>
            </div>
          </section>
          <div className="flex justify-end gap-3">
            <a href={initial.id ? `/captaciones/${initial.id}` : "/captaciones"} className="btn-secondary">
              Cancelar
            </a>
            <SubmitButton>{initial.id ? "Guardar cambios" : "Crear captación"}</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
