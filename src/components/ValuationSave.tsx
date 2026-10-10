"use client";

import { Save } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { saveValuation } from "@/app/(app)/tasador/actions";

export function ValuationSave({ values }: { values: Record<string, string | undefined> }) {
  return (
    <ActionForm action={saveValuation}>
      {Object.entries(values).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <SubmitButton className="btn-primary btn-sm">
        <Save className="h-4 w-4" /> Guardar e imprimir informe
      </SubmitButton>
    </ActionForm>
  );
}
