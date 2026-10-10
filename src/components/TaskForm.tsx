"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { ActionForm, Modal, SubmitButton } from "@/components/forms";
import { Field, Select } from "@/components/ui";
import { saveTask } from "@/app/(app)/tareas/actions";
import { PRIORITIES } from "@/lib/constants";

type Opt = { id: number; label: string };
export type TaskValues = { id?: number; title?: string; description?: string | null; dueAt?: string; priority?: string; agentId?: number | null; clientId?: number | null; propertyId?: number | null };

export function TaskModalButton({ agents, clients, properties, isAdmin, userId, initial, label, className = "btn-primary" }: { agents: { value: number; label: string }[]; clients: Opt[]; properties: Opt[]; isAdmin: boolean; userId: number; initial?: TaskValues; label?: React.ReactNode; className?: string }) {
  const sp = useSearchParams();
  const [open, setOpen] = useState(() => !initial && !!sp.get("new"));
  const router = useRouter();
  const today = new Date();
  const def = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}T18:00`;
  const v = initial ?? { dueAt: def, priority: "media", agentId: userId };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label ?? (
          <>
            <Plus className="h-4 w-4" /> Nueva tarea
          </>
        )}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={initial?.id ? "Editar tarea" : "Nueva tarea"}>
        <ActionForm
          action={saveTask}
          onSuccess={() => {
            setOpen(false);
            router.replace("/tareas");
            router.refresh();
          }}
          className="space-y-4"
        >
          {(fe) => (
            <>
              {v.id && <input type="hidden" name="id" value={v.id} />}
              <Field label="Tarea *" error={fe.title}>
                <input name="title" defaultValue={v.title ?? ""} className="input" required autoFocus />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Vencimiento">
                  <input name="dueAt" type="datetime-local" defaultValue={v.dueAt ?? ""} className="input" />
                </Field>
                <Field label="Prioridad">
                  <Select name="priority" defaultValue={v.priority ?? "media"} options={PRIORITIES} />
                </Field>
                <Field label="Cliente">
                  <Select name="clientId" defaultValue={v.clientId ? String(v.clientId) : ""} options={clients.map((c) => ({ value: c.id, label: c.label }))} placeholder="— Ninguno —" />
                </Field>
                <Field label="Propiedad">
                  <Select name="propertyId" defaultValue={v.propertyId ? String(v.propertyId) : ""} options={properties.map((c) => ({ value: c.id, label: c.label }))} placeholder="— Ninguna —" />
                </Field>
                <Field label="Asignada a" className="sm:col-span-2">
                  <Select name="agentId" defaultValue={String(v.agentId ?? userId)} options={agents} disabled={!isAdmin} />
                </Field>
              </div>
              <Field label="Descripción">
                <textarea name="description" rows={3} defaultValue={v.description ?? ""} className="input" />
              </Field>
              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <SubmitButton>Guardar</SubmitButton>
              </div>
            </>
          )}
        </ActionForm>
      </Modal>
    </>
  );
}
