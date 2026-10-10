import { notFound, forbidden } from "next/navigation";
import { requireUser, canEdit } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui";
import { ClientForm } from "@/components/ClientForm";
import { agentOptions, distinctZones } from "@/lib/queries/properties";
import { getClient } from "@/lib/queries/clients";
import { parseJsonArray } from "@/lib/format";

export const metadata = { title: "Editar cliente" };

export default async function EditClient({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const row = getClient(Number((await params).id));
  if (!row) notFound();
  if (!canEdit(u, row.c)) forbidden();
  const { c, pref } = row;
  const zones = Array.from(new Set(distinctZones().flatMap((z) => [z.zone, z.city])));
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader title={`Editar ${c.name} ${c.surname ?? ""}`} back={`/clientes/${c.id}`} />
      <ClientForm
        initial={{
          ...c,
          pref: pref ? { ...pref, types: parseJsonArray(pref.types), zones: parseJsonArray(pref.zones), features: parseJsonArray(pref.features) } : null,
        }}
        agents={agentOptions()}
        isAdmin={u.role === "admin"}
        zoneSuggestions={zones}
      />
    </div>
  );
}
