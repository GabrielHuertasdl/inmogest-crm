import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui";
import { PropertyForm, type PropertyFormValues } from "@/components/PropertyForm";
import { agentOptions, allPortals, clientOptions } from "@/lib/queries/properties";
import { db, schema } from "@/db";

export const metadata = { title: "Añadir propiedad" };

export default async function NewProperty({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const u = await requireUser();
  const { lead } = await searchParams;
  const ag = db.select().from(schema.agency).get();
  let initial: PropertyFormValues = { agentId: u.id, publishedWeb: true, operation: "venta", type: "piso", status: "disponible", province: ag?.province ?? null, city: ag?.city ?? null };
  if (lead) {
    const l = db.select().from(schema.leads).where(eq(schema.leads.id, Number(lead))).get();
    if (l)
      initial = {
        ...initial,
        leadId: l.id,
        title: `${l.type ? l.type.charAt(0).toUpperCase() + l.type.slice(1) : "Inmueble"} en ${l.zone ?? l.city ?? ""}`.trim(),
        operation: l.operation ?? "venta",
        type: l.type ?? "piso",
        price: l.expectedPrice ?? undefined,
        address: l.address,
        city: l.city,
        zone: l.zone,
        agentId: l.agentId ?? u.id,
      };
  }
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader title="Añadir propiedad" subtitle={lead ? "Convertir captación en propiedad" : "Completa la ficha del inmueble"} back="/propiedades" />
      <PropertyForm
        initial={initial}
        agents={agentOptions()}
        clients={clientOptions()}
        portals={allPortals()}
        isAdmin={u.role === "admin"}
        defaultCenter={[ag?.lat ?? 40.4168, ag?.lng ?? -3.7038]}
      />
    </div>
  );
}
