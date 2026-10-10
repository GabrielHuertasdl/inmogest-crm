import { Phone, Mail, MapPin } from "lucide-react";
import { publicAgency } from "@/lib/queries/public";
import { ContactForm } from "@/components/web/client";
import { MapView } from "@/components/maps";

export const metadata = { title: "Contacto" };

export default function Contact() {
  const a = publicAgency();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold text-slate-900">Contacto</h1>
      <p className="mb-8 text-slate-500">¿Buscas casa, quieres vender o tienes cualquier duda? Escríbenos.</p>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
          <ContactForm />
        </div>
        <div className="space-y-6">
          <div className="space-y-3 rounded-2xl bg-white p-6 text-sm shadow-sm ring-1 ring-slate-100">
            {a.phone && (
              <a href={`tel:${a.phone.replace(/\s/g, "")}`} className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[var(--brand)]" /> {a.phone}
              </a>
            )}
            {a.email && (
              <a href={`mailto:${a.email}`} className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[var(--brand)]" /> {a.email}
              </a>
            )}
            {a.address && (
              <p className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-[var(--brand)]" /> {[a.address, a.postalCode, a.city].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          {a.lat != null && a.lng != null && <MapView center={[a.lat, a.lng]} zoom={15} pins={[{ id: "office", lat: a.lat, lng: a.lng, color: a.primaryColor }]} height={300} />}
        </div>
      </div>
    </div>
  );
}
