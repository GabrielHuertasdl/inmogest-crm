import Link from "next/link";
import { BedDouble, Bath, Ruler, MapPin } from "lucide-react";
import { FavButton } from "./client";
import type { PublicProperty } from "@/lib/queries/public";
import { OPERATIONS, PROPERTY_TYPES } from "@/lib/constants";
import { euros } from "@/lib/format";

export function PublicCard({ p }: { p: PublicProperty }) {
  return (
    <Link href={`/web/propiedades/${p.ref}`} className="group relative block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        {p.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/files/${p.cover}`} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full bg-slate-100" />
        )}
        <span className="absolute top-3 left-3 rounded-full bg-[var(--brand)] px-3 py-1 text-xs font-semibold text-white">{OPERATIONS[p.operation]}</span>
        {p.status === "reservado" && <span className="absolute top-3 left-24 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">Reservado</span>}
        <FavButton refCode={p.ref} className="absolute top-3 right-3" />
      </div>
      <div className="p-5">
        <p className="text-2xl font-bold text-slate-900">
          {euros(p.price)}
          {p.operation === "alquiler" && <span className="text-sm font-normal text-slate-500">/mes</span>}
        </p>
        <p className="mt-1 truncate font-medium text-slate-800">{p.title}</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-4 w-4" /> {[p.zone, p.city].filter(Boolean).join(", ")}
        </p>
        <div className="mt-4 flex gap-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
          <span className="text-xs text-slate-400">{PROPERTY_TYPES[p.type]}</span>
          {p.rooms != null && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-4 w-4" /> {p.rooms}
            </span>
          )}
          {p.baths != null && (
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" /> {p.baths}
            </span>
          )}
          {p.areaBuilt != null && (
            <span className="flex items-center gap-1">
              <Ruler className="h-4 w-4" /> {p.areaBuilt} m²
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
