import type { Event } from "@/db/schema";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const date = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

/** RFC 5545 line folding at 75 octets. */
function fold(line: string) {
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch) > 75) {
      out.push(cur);
      cur = " " + ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n");
}

export function buildIcs(events: (Event & { clientName?: string | null; propertyRef?: string | null })[], calName: string, kinds: Record<string, string>) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Inmogest//CRM//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${esc(calName)}`, "X-WR-TIMEZONE:Europe/Madrid"];
  const now = utc(new Date());
  for (const e of events) {
    const desc = [e.details, e.clientName && `Cliente: ${e.clientName}`, e.propertyRef && `Propiedad: ${e.propertyRef}`].filter(Boolean).join("\n");
    lines.push("BEGIN:VEVENT", `UID:event-${e.id}@inmogest.local`, `DTSTAMP:${now}`);
    if (e.allDay) {
      const next = new Date(e.startsAt.getTime() + 86400000);
      lines.push(`DTSTART;VALUE=DATE:${date(e.startsAt)}`, `DTEND;VALUE=DATE:${date(next)}`);
    } else {
      lines.push(`DTSTART:${utc(e.startsAt)}`, `DTEND:${utc(e.endsAt ?? new Date(e.startsAt.getTime() + 3600000))}`);
    }
    lines.push(`SUMMARY:${esc(`${kinds[e.kind] ?? e.kind}: ${e.title}`)}`);
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);
    lines.push(`CATEGORIES:${esc(kinds[e.kind] ?? e.kind)}`, `STATUS:${e.done ? "COMPLETED" : "CONFIRMED"}`);
    if (e.reminderMinutes != null) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(e.title)}`, `TRIGGER:-PT${e.reminderMinutes}M`, "END:VALARM");
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
