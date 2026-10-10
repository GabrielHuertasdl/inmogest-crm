"use client";

import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { changePassword, updateProfile } from "@/app/(app)/agentes/actions";

export function ProfileForm({ name, phone, color, hasAvatar }: { name: string; phone: string | null; color: string; hasAvatar: boolean }) {
  return (
    <ActionForm action={updateProfile} refresh className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          <input name="name" defaultValue={name} className="input" required />
        </Field>
        <Field label="Teléfono">
          <input name="phone" defaultValue={phone ?? ""} className="input" />
        </Field>
        <Field label="Foto de perfil" hint="JPG, PNG o WEBP">
          <input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" />
        </Field>
        <Field label="Color en el calendario">
          <input name="color" type="color" defaultValue={color} className="h-10 w-20 cursor-pointer rounded-lg border border-line" />
        </Field>
      </div>
      {hasAvatar && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="removeAvatar" className="h-4 w-4 accent-brand-600" /> Quitar foto actual
        </label>
      )}
      <div className="flex justify-end">
        <SubmitButton>Guardar perfil</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function PasswordForm() {
  return (
    <ActionForm action={changePassword} resetOnSuccess className="space-y-4">
      {(fe) => (
        <>
          <Field label="Contraseña actual" error={fe.current}>
            <input name="current" type="password" autoComplete="current-password" className="input" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nueva contraseña" error={fe.next} hint="Mínimo 8 caracteres">
              <input name="next" type="password" autoComplete="new-password" className="input" required minLength={8} />
            </Field>
            <Field label="Repite la nueva contraseña" error={fe.confirm}>
              <input name="confirm" type="password" autoComplete="new-password" className="input" required minLength={8} />
            </Field>
          </div>
          <div className="flex justify-end">
            <SubmitButton>Cambiar contraseña</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
