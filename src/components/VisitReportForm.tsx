"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Select } from "@/components/ui";
import { SignaturePad } from "@/components/SignaturePad";
import { saveVisitReport } from "@/app/(app)/partes-visita/actions";
import { INTEREST_LEVELS } from "@/lib/constants";

type Opt = { id: number; label: string };

export function VisitReportForm({ properties, clients, initial }: { properties: Opt[]; clients: Opt[]; initial: { propertyId?: string; clientId?: string; eventId?: string; visitedAt: string } }) {
  const [rating, setRating] = useState(0);
  return (
    <ActionForm action={saveVisitReport} className="space-y-6">
      {(fe) => (
        <>
          {initial.eventId && <input type="hidden" name="eventId" value={initial.eventId} />}
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Visita</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Propiedad *" error={fe.propertyId}>
                <Select name="propertyId" defaultValue={initial.propertyId ?? ""} options={properties.map((p) => ({ value: p.id, label: p.label }))} placeholder="Selecciona…" required />
              </Field>
              <Field label="Cliente *" error={fe.clientId}>
                <Select name="clientId" defaultValue={initial.clientId ?? ""} options={clients.map((p) => ({ value: p.id, label: p.label }))} placeholder="Selecciona…" required />
              </Field>
              <Field label="Fecha y hora *" error={fe.visitedAt}>
                <input name="visitedAt" type="datetime-local" defaultValue={initial.visitedAt} className="input" required />
              </Field>
              <Field label="DNI del visitante">
                <input name="clientDni" className="input" />
              </Field>
            </div>
          </section>
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Valoración del cliente</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <span className="label">Puntuación</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} estrellas`}>
                      <Star className={`h-7 w-7 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                    </button>
                  ))}
                </div>
                <input type="hidden" name="rating" value={rating || ""} />
              </div>
              <Field label="Nivel de interés">
                <Select name="interestLevel" defaultValue="medio" options={INTEREST_LEVELS} />
              </Field>
              <Field label="Oferta (€)">
                <input name="offerAmount" type="number" min={0} className="input" />
              </Field>
              <Field label="Comentarios" className="sm:col-span-3">
                <textarea name="feedback" rows={4} className="input" placeholder="Qué le ha gustado, objeciones, próximos pasos…" />
              </Field>
            </div>
          </section>
          <section className="card p-6">
            <h2 className="mb-1 text-lg font-semibold">Firma del visitante</h2>
            <p className="mb-4 text-sm text-muted">El visitante declara haber visitado el inmueble indicado a través de esta agencia.</p>
            <SignaturePad />
            {fe.signature && <p className="mt-1 text-xs text-red-600">{fe.signature[0]}</p>}
          </section>
          <div className="flex justify-end gap-2">
            <a href="/partes-visita" className="btn-secondary">
              Cancelar
            </a>
            <SubmitButton>Guardar parte de visita</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
