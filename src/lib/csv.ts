/** Spanish-Excel friendly CSV: semicolon separator, UTF-8 BOM, RFC 4180 quoting. */
export function toCsv(headers: string[], rows: (string | number | null | undefined | boolean)[][]) {
  const cell = (v: unknown) => {
    if (v == null) return "";
    let s = typeof v === "number" ? String(v).replace(".", ",") : String(v);
    if (/^[=+\-@]/.test(s)) s = `'${s}`; // formula injection guard
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [headers, ...rows].map((r) => r.map(cell).join(";")).join("\r\n") + "\r\n";
}

export function csvResponse(name: string, body: string) {
  return new Response(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}"` } });
}
