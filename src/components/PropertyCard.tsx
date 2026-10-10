import Link from "next/link";
import { BedDouble, Bath, Ruler, MapPin, Share2, Star } from "lucide-react";
import { Badge } from "@/components/ui";
import { OPERATIONS, PROPERTY_STATUS, PROPERTY_TYPES, STATUS_TONE } from "@/lib/constants";
import { euros } from "@/lib/format";

export type CardProperty = {
  id: number;
  ref: string;
  title: string;
  operation: string;
  type: string;
  status: string;
  price: number;
  areaBuilt: number | null;
  rooms: number | null;
  baths: number | null;
  city: string | null;
  zone: string | null;
  cover: string | null;
  isShared?: boolean;
  featured?: boolean;
  agentName?: string | null;
};

export function PropertyThumb({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/files/${src}`} alt={alt} loading="lazy" className={`object-cover ${className}`} />
  ) : (
    <div className={`grid place-items-center bg-slate-100 text-xs text-muted ${className}`}>Sin foto</div>
  );
}

export function PropertyCard({ p, href = `/propiedades/${p.id}` }: { p: CardProperty; href?: string }) {
  return (
    <Link href={href} className="card group block overflow-hidden transition hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden">
        <PropertyThumb src={p.cover} alt={p.title} className="h-full w-full transition duration-300 group-hover:scale-[1.03]" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge tone={STATUS_TONE[p.status]} className="bg-white/95">
            {PROPERTY_STATUS[p.status]}
          </Badge>
          {p.isShared && (
            <Badge tone="violet" className="bg-white/95">
              <Share2 className="h-3 w-3" /> Compartida
            </Badge>
          )}
        </div>
        {p.featured && <Star className="absolute top-3 right-3 h-5 w-5 fill-amber-400 text-amber-400 drop-shadow" />}
        <span className="absolute bottom-3 left-3 rounded-md bg-slate-900/70 px-2 py-0.5 text-xs font-medium text-white">{p.ref}</span>
      </div>
      <div className="p-4">
        <p className="text-lg font-bold text-ink">
          {euros(p.price)}
          {p.operation === "alquiler" && <span className="text-sm font-normal text-muted">/mes</span>}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium">{p.title}</p>
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
          <MapPin className="h-3.5 w-3.5" /> {[p.zone, p.city].filter(Boolean).join(", ") || "—"}
        </p>
        <div className="mt-3 flex items-center gap-4 border-t border-line pt-3 text-xs text-slate-600">
          <span>{PROPERTY_TYPES[p.type]} · {OPERATIONS[p.operation]}</span>
          <span className="ml-auto flex items-center gap-3">
            {p.rooms != null && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5" /> {p.rooms}
              </span>
            )}
            {p.baths != null && (
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" /> {p.baths}
              </span>
            )}
            {p.areaBuilt != null && (
              <span className="flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5" /> {p.areaBuilt} m²
              </span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
