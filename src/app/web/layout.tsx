import Link from "next/link";
import type { Metadata } from "next";
import { Heart, Phone, Mail, MapPin } from "lucide-react";
import { publicAgency } from "@/lib/queries/public";
import { FavCount } from "@/components/web/client";
import { LogoMark } from "@/components/layout/Logo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const a = publicAgency();
  return { title: { default: a.websiteTitle ?? a.name, template: `%s · ${a.name}` }, description: a.websiteTagline ?? undefined };
}

export default function WebLayout({ children }: { children: React.ReactNode }) {
  const a = publicAgency();
  const nav = [
    ["/web/propiedades?operation=venta", "Comprar"],
    ["/web/propiedades?operation=alquiler", "Alquilar"],
    ["/web/hipoteca", "Hipoteca"],
    ["/web/empresa", "Quiénes somos"],
    ["/web/contacto", "Contacto"],
  ];
  return (
    <div style={{ "--brand": a.primaryColor, "--accent": a.accentColor } as React.CSSProperties} className="min-h-dvh bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link href="/web" className="flex items-center gap-2 font-bold text-slate-900">
            {a.logoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/files/${a.logoPath}`} alt={a.name} className="h-9 w-auto" />
            ) : (
              <>
                <LogoMark size={32} /> {a.name}
              </>
            )}
          </Link>
          <nav className="ml-auto hidden gap-1 text-sm font-medium md:flex">
            {nav.map(([h, l]) => (
              <Link key={h} href={h} className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                {l}
              </Link>
            ))}
          </nav>
          <Link href="/web/favoritos" className="ml-auto flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 md:ml-0">
            <Heart className="mr-1 h-4 w-4" /> Favoritos <FavCount />
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 text-sm md:hidden">
          {nav.map(([h, l]) => (
            <Link key={h} href={h} className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-slate-700">
              {l}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="mt-20 bg-slate-900 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
          <div>
            <p className="text-lg font-bold text-white">{a.name}</p>
            <p className="mt-2 text-sm text-slate-400">{a.websiteTagline}</p>
            <div className="mt-4 flex gap-3 text-sm">
              {(["facebook", "instagram", "linkedin", "x"] as const).map((k) =>
                a[k] ? (
                  <a key={k} href={a[k]!} target="_blank" rel="noreferrer noopener" className="rounded-lg bg-white/10 px-3 py-1.5 capitalize hover:bg-white/20">
                    {k === "x" ? "X" : k}
                  </a>
                ) : null,
              )}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Contacto</p>
            {a.phone && (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> {a.phone}
              </p>
            )}
            {a.email && (
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> {a.email}
              </p>
            )}
            {a.address && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {[a.address, a.postalCode, a.city].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Enlaces</p>
            {nav.map(([h, l]) => (
              <Link key={h} href={h} className="block hover:text-white">
                {l}
              </Link>
            ))}
          </div>
        </div>
        <p className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {a.legalName ?? a.name}. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
