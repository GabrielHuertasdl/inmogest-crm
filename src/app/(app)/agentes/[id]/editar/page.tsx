import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui";
import { AgentForm } from "@/components/AgentForm";
import { db, schema } from "@/db";
import { parseJsonArray } from "@/lib/format";

export const metadata = { title: "Editar agente" };

export default async function EditAgent({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const a = db.select().from(schema.users).where(eq(schema.users.id, Number((await params).id))).get();
  if (!a) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Editar ${a.name}`} back={`/agentes/${a.id}`} />
      <AgentForm initial={{ id: a.id, name: a.name, email: a.email, phone: a.phone, role: a.role, color: a.color, active: a.active, permissions: parseJsonArray(a.permissions) }} />
    </div>
  );
}
