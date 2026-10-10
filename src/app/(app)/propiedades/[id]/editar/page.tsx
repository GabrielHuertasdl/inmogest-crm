import { notFound } from "next/navigation";
import { requireUser, canEdit } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui";
import { PropertyForm } from "@/components/PropertyForm";
import { agentOptions, allPortals, clientOptions, getProperty } from "@/lib/queries/properties";
import { db, schema } from "@/db";
import { forbidden } from "next/navigation";

export const metadata = { title: "Editar propiedad" };

export default async function EditProperty({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const p = getProperty(Number((await params).id));
  if (!p) notFound();
  if (!canEdit(u, p)) forbidden();
  const ag = db.select().from(schema.agency).get();
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader title={`Editar ${p.ref}`} subtitle={p.title} back={`/propiedades/${p.id}`} />
      <PropertyForm initial={formValues(p)} agents={agentOptions()} clients={clientOptions()} portals={allPortals()} isAdmin={u.role === "admin"} defaultCenter={[ag?.lat ?? 40.4168, ag?.lng ?? -3.7038]} />
    </div>
  );
}

// Only pass form fields to the client (never the joined agent/owner rows).
function formValues(p: NonNullable<ReturnType<typeof getProperty>>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { agent, owner, photos, createdAt, updatedAt, closedAt, features, ref, ...rest } = p;
  return { ...rest, leadId: undefined };
}
