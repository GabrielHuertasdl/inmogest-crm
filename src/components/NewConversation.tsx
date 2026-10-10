"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { ActionForm, Modal, SubmitButton } from "@/components/forms";
import { Field, Select } from "@/components/ui";
import { newConversation } from "@/app/(app)/mensajes/actions";

type Opt = { id: number; label: string };

export function NewConversation({ clients, properties, agents }: { clients: Opt[]; properties: Opt[]; agents: { value: number; label: string }[] }) {
  const sp = useSearchParams();
  const [open, setOpen] = useState(() => !!sp.get("nuevo"));
  const [channel, setChannel] = useState("email");
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="h-4 w-4" /> Nuevo mensaje
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo mensaje">
        <ActionForm action={newConversation} className="space-y-4">
          {(fe) => (
            <>
              <div className="flex gap-2">
                {[
                  ["email", "A un cliente"],
                  ["interno", "Nota interna a un agente"],
                ].map(([k, l]) => (
                  <label key={k} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${channel === k ? "border-brand-600 bg-brand-600 text-white" : "border-line"}`}>
                    <input type="radio" name="channel" value={k} checked={channel === k} onChange={() => setChannel(k)} className="sr-only" />
                    {l}
                  </label>
                ))}
              </div>
              {channel === "email" ? (
                <Field label="Cliente *" error={fe.clientId}>
                  <Select name="clientId" defaultValue={sp.get("clientId") ?? ""} options={clients.map((c) => ({ value: c.id, label: c.label }))} placeholder="Selecciona…" />
                </Field>
              ) : (
                <Field label="Para">
                  <Select name="toAgentId" options={agents} />
                </Field>
              )}
              <Field label="Propiedad relacionada">
                <Select name="propertyId" options={properties.map((c) => ({ value: c.id, label: c.label }))} placeholder="— Ninguna —" />
              </Field>
              <Field label="Asunto *" error={fe.subject}>
                <input name="subject" className="input" required />
              </Field>
              <Field label="Mensaje *" error={fe.body}>
                <textarea name="body" rows={5} className="input" required />
              </Field>
              <p className="text-xs text-muted">Los mensajes a clientes quedan registrados en el CRM. El envío real por email requiere configurar un servidor SMTP.</p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <SubmitButton>Crear</SubmitButton>
              </div>
            </>
          )}
        </ActionForm>
      </Modal>
    </>
  );
}
