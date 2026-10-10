import { requireAdmin } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui";
import { AgentForm } from "@/components/AgentForm";

export const metadata = { title: "Añadir agente" };

export default async function NewAgent() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Añadir agente" subtitle="Crea un usuario con acceso al CRM" back="/agentes" />
      <AgentForm initial={{ permissions: ["ver_facturas"] }} />
    </div>
  );
}
