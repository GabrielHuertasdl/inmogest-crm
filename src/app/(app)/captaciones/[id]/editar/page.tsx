import { eq } from "drizzle-orm";
import { notFound, forbidden } from "next/navigation";
import { requireUser, canEdit } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui";
import { LeadForm } from "@/components/LeadForm";
import { agentOptions } from "@/lib/queries/properties";
import { db, schema } from "@/db";

export const metadata = { title: "Editar captación" };

export default async function EditLead({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const l = db.select().from(schema.leads).where(eq(schema.leads.id, Number((await params).id))).get();
  if (!l) notFound();
  if (!canEdit(u, l)) forbidden();
  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader title={`Editar captación · ${l.ownerName}`} back={`/captaciones/${l.id}`} />
      <LeadForm initial={l} agents={agentOptions()} isAdmin={u.role === "admin"} />
    </div>
  );
}
