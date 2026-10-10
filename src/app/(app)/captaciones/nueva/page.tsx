import { requireUser } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui";
import { LeadForm } from "@/components/LeadForm";
import { agentOptions } from "@/lib/queries/properties";

export const metadata = { title: "Nueva captación" };

export default async function NewLead() {
  const u = await requireUser();
  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader title="Nueva captación" back="/captaciones" />
      <LeadForm initial={{ agentId: u.id, stage: "nuevo", operation: "venta" }} agents={agentOptions()} isAdmin={u.role === "admin"} />
    </div>
  );
}
