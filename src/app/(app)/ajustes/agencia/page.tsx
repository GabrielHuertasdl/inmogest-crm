import { requireUser } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui";
import { AgencyForm } from "@/components/SettingsForms";
import { db, schema } from "@/db";

export const metadata = { title: "Ajustes · Agencia" };

export default async function AgencySettings() {
  const u = await requireUser();
  const a = db.select().from(schema.agency).get()!;
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Ajustes de la agencia" subtitle={u.role === "admin" ? "Datos que aparecen en facturas, fichas y página web" : "Solo los administradores pueden modificar estos datos"} />
      <AgencyForm a={a} disabled={u.role !== "admin"} />
    </div>
  );
}
