"use client";

import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Select } from "@/components/ui";
import { saveAgent } from "@/app/(app)/agentes/actions";
import { PERMISSIONS, ROLES } from "@/lib/constants";

export function AgentForm({ initial }: { initial: { id?: number; name?: string; email?: string; phone?: string | null; role?: string; color?: string; active?: boolean; permissions?: string[] } }) {
  return (
    <ActionForm action={saveAgent} className="card space-y-6 p-6">
      {(fe) => (
        <>
          {initial.id && <input type="hidden" name="id" value={initial.id} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo *" error={fe.name}>
              <input name="name" defaultValue={initial.name ?? ""} className="input" required />
            </Field>
            <Field label="Email (usuario) *" error={fe.email}>
              <input name="email" type="email" defaultValue={initial.email ?? ""} className="input" required />
            </Field>
            <Field label="Teléfono">
              <input name="phone" defaultValue={initial.phone ?? ""} className="input" />
            </Field>
            <Field label="Rol">
              <Select name="role" defaultValue={initial.role ?? "agente"} options={ROLES} />
            </Field>
            <Field label={initial.id ? "Nueva contraseña (opcional)" : "Contraseña inicial *"} error={fe.password} hint="Mínimo 8 caracteres">
              <input name="password" type="password" autoComplete="new-password" className="input" minLength={8} />
            </Field>
            <Field label="Color en el calendario">
              <input name="color" type="color" defaultValue={initial.color ?? "#3463e6"} className="h-10 w-20 cursor-pointer rounded-lg border border-line" />
            </Field>
          </div>
          <div>
            <p className="label">Permisos adicionales (agentes)</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(PERMISSIONS).map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="permissions[]" value={k} defaultChecked={initial.permissions?.includes(k)} className="h-4 w-4 accent-brand-600" /> {l}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Los administradores tienen todos los permisos.</p>
          </div>
          {initial.id && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={initial.active} className="h-4 w-4 accent-brand-600" /> Usuario activo (puede iniciar sesión)
            </label>
          )}
          <div className="flex justify-end gap-2">
            <a href={initial.id ? `/agentes/${initial.id}` : "/agentes"} className="btn-secondary">
              Cancelar
            </a>
            <SubmitButton>{initial.id ? "Guardar" : "Crear agente"}</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
