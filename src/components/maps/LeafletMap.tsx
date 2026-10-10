"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from "react-leaflet";
import { useEffect } from "react";

export type Pin = { id: number | string; lat: number; lng: number; color?: string; label?: string; html?: string; href?: string };

const pinIcon = (color = "#3463e6", label?: string) =>
  L.divIcon({
    className: "",
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -36],
    html: `<div style="position:relative;width:30px;height:40px"><svg viewBox="0 0 30 40" width="30" height="40"><path d="M15 0C6.7 0 0 6.6 0 14.8 0 26 15 40 15 40s15-14 15-25.2C30 6.6 23.3 0 15 0Z" fill="${color}"/><circle cx="15" cy="15" r="6" fill="#fff"/></svg>${label ? `<span style="position:absolute;left:50%;top:-20px;transform:translateX(-50%);white-space:nowrap;background:#1d2433;color:#fff;font:600 11px/1 sans-serif;padding:4px 6px;border-radius:6px">${label}</span>` : ""}</div>`,
  });

function Fit({ pins }: { pins: Pin[] }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length > 1) map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number])), { padding: [40, 40], maxZoom: 15 });
  }, [pins, map]);
  return null;
}

function Picker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function LeafletMap({
  center,
  zoom = 13,
  pins = [],
  height = 360,
  fit,
  approx,
  onPick,
  follow,
}: {
  center: [number, number];
  zoom?: number;
  pins?: Pin[];
  height?: number | string;
  fit?: boolean;
  approx?: boolean;
  onPick?: (lat: number, lng: number) => void;
  follow?: boolean;
}) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={!!onPick || !!fit} style={{ height, width: "100%", borderRadius: 14, zIndex: 0 }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {fit && <Fit pins={pins} />}
      {onPick && <Picker onPick={onPick} />}
      {follow && pins[0] && <Recenter lat={pins[0].lat} lng={pins[0].lng} />}
      {approx
        ? pins.map((p) => <Circle key={p.id} center={[p.lat, p.lng]} radius={350} pathOptions={{ color: p.color ?? "#3463e6", fillOpacity: 0.15 }} />)
        : pins.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon(p.color, p.label)}>
              {p.html && (
                <Popup>
                  <div dangerouslySetInnerHTML={{ __html: p.html }} />
                </Popup>
              )}
            </Marker>
          ))}
    </MapContainer>
  );
}
