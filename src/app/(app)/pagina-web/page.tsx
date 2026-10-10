import Link from "next/link";
import { forbidden } from "next/navigation";
import { count, and, eq, inArray } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { requireUser, can } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui";
import { WebsiteForm } from "@/components/SettingsForms";
import { db, schema } from "@/db";

export const metadata = { title: "Página web" };

export default async function WebsiteSettings() {
  const u = await requireUser();
  if (!can(u, "web")) forbidden();
  const a = db.select().from(schema.agency).get()!;
  const published = db.select({ n: count() }).from(schema.properties).where(and(eq(schema.properties.publishedWeb, true), inArray(schema.properties.status, ["disponible", "reservado"]))).get()?.n ?? 0;
  const featured = db.select({ n: count() }).from(schema.properties).where(and(eq(schema.properties.featured, true), inArray(schema.properties.status, ["disponible", "reservado"]))).get()?.n ?? 0;
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Página web"
        subtitle="Tu web inmobiliaria se genera automáticamente con tus propiedades publicadas"
        actions={
          <Link href="/web" target="_blank" className="btn-primary">
            <ExternalLink className="h-4 w-4" /> Abrir web
          </Link>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs text-muted">Propiedades publicadas</p>
          <p className="mt-1 text-xl font-bold">{published}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Destacadas</p>
          <p className="mt-1 text-xl font-bold">{featured}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Dirección</p>
          <p className="mt-1 truncate font-medium text-brand-600">/web</p>
        </div>
      </div>
      <WebsiteForm a={a} />
    </div>
  );
}
