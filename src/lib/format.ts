import { format as dfFormat } from "date-fns";
import { es } from "date-fns/locale";

export const TZ = "Europe/Madrid";

const eur0 = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const num = new Intl.NumberFormat("es-ES");

export const euros = (v: number | null | undefined) => (v == null ? "—" : eur0.format(v));
export const cents = (v: number | null | undefined) => (v == null ? "—" : eur2.format(v / 100));
export const number = (v: number | null | undefined) => (v == null ? "—" : num.format(v));
export const m2 = (v: number | null | undefined) => (v == null ? "—" : `${num.format(v)} m²`);

/** Wall-clock parts of a date in Madrid time. */
export function madridParts(d: Date) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const g = (t: string) => Number(p.find((x) => x.type === t)!.value);
  return { y: g("year"), m: g("month"), d: g("day"), h: g("hour"), min: g("minute") };
}

/** Convert a Madrid wall-clock time to a UTC Date. */
export function fromMadrid(y: number, m: number, d: number, h = 0, min = 0) {
  const guess = new Date(Date.UTC(y, m - 1, d, h, min));
  const p = madridParts(guess);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min);
  return new Date(guess.getTime() - (asUtc - guess.getTime()));
}

/** "Floating" Date whose local fields equal Madrid wall-clock (for date-fns formatting). */
export function toWall(d: Date) {
  const p = madridParts(d);
  return new Date(p.y, p.m - 1, p.d, p.h, p.min);
}

export const fmt = (d: Date | null | undefined, pattern = "dd/MM/yyyy") => (d ? dfFormat(toWall(d), pattern, { locale: es }) : "—");
export const fmtDateTime = (d: Date | null | undefined) => fmt(d, "dd/MM/yyyy HH:mm");
export const fmtTime = (d: Date | null | undefined) => fmt(d, "HH:mm");

export function dayKey(d: Date) {
  const p = madridParts(d);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}
export function parseDayKey(k: string) {
  const [y, m, d] = k.split("-").map(Number);
  return { y, m, d };
}
export function dayBounds(k: string) {
  const { y, m, d } = parseDayKey(k);
  const start = fromMadrid(y, m, d);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const end = fromMadrid(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
  return { start, end };
}
export const todayKey = () => dayKey(new Date());
export const nowMs = () => Date.now();
export const daysFromNowKey = (n: number) => dayKey(new Date(Date.now() + n * 86_400_000));

/** yyyy-MM-ddTHH:mm in Madrid time, for <input type="datetime-local">. */
export function toInputDateTime(d: Date | null | undefined) {
  if (!d) return "";
  const p = madridParts(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.h)}:${pad(p.min)}`;
}
export function fromInputDateTime(v: string | null | undefined) {
  if (!v) return null;
  const [date, time = "00:00"] = v.split("T");
  const { y, m, d } = parseDayKey(date);
  const [h, min] = time.split(":").map(Number);
  return fromMadrid(y, m, d, h, min);
}
export const toInputDate = (d: Date | null | undefined) => (d ? dayKey(d) : "");
export const fromInputDate = (v: string | null | undefined) => {
  if (!v) return null;
  const { y, m, d } = parseDayKey(v);
  return fromMadrid(y, m, d, 12);
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function normalize(s: string | null | undefined) {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function parseJsonArray(s: string | null | undefined): string[] {
  try {
    const v = JSON.parse(s ?? "[]");
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
