"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Pin } from "./LeafletMap";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false, loading: () => <div className="h-full min-h-[240px] w-full animate-pulse rounded-2xl bg-slate-100" /> });
export type { Pin };

export function MapView(props: { center: [number, number]; zoom?: number; pins?: Pin[]; height?: number | string; fit?: boolean; approx?: boolean }) {
  return <LeafletMap {...props} />;
}

/** Click-to-place map that writes lat/lng into hidden inputs. */
export function MapPicker({ lat, lng, defaultCenter = [39.4699, -0.3763], height = 320, onChange }: { lat?: number | null; lng?: number | null; defaultCenter?: [number, number]; height?: number; onChange?: (lat: number, lng: number) => void }) {
  const [pos, setPos] = useState<[number, number] | null>(lat != null && lng != null ? [lat, lng] : null);
  const pick = (a: number, b: number) => {
    const p: [number, number] = [Math.round(a * 1e6) / 1e6, Math.round(b * 1e6) / 1e6];
    setPos(p);
    onChange?.(p[0], p[1]);
  };
  return (
    <div>
      <LeafletMap center={pos ?? defaultCenter} zoom={pos ? 15 : 12} pins={pos ? [{ id: 1, lat: pos[0], lng: pos[1] }] : []} height={height} onPick={pick} />
      <input type="hidden" name="lat" value={pos?.[0] ?? ""} />
      <input type="hidden" name="lng" value={pos?.[1] ?? ""} />
      <p className="mt-2 text-xs text-muted">{pos ? `Ubicación: ${pos[0]}, ${pos[1]} · Haz clic en el mapa para moverla.` : "Haz clic en el mapa para situar el inmueble."}</p>
    </div>
  );
}

