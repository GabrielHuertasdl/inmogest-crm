import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/guards";
import { csvResponse, toCsv } from "@/lib/csv";
import { listProperties } from "@/lib/queries/properties";
import { listClients } from "@/lib/queries/clients";
import { CLIENT_KINDS, CLIENT_SOURCES, CLIENT_STATUS, INVOICE_STATUS, OPERATIONS, PROPERTY_STATUS, PROPERTY_TYPES } from "@/lib/constants";
import { fmt, fromMadrid, parseJsonArray } from "@/lib/format";

export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const u = await getSession();
  if (!u) return new Response("No autenticado", { status: 401 });
  if (!can(u, "exportar")) return new Response("No tienes permiso para exportar", { status: 403 });
  const kind = (await params).kind.replace(/\.csv$/, "");
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  if (kind === "propiedades") {
    const { rows } = listProperties({ ...sp, page: "1" }, 100000);
    return csvResponse(
      "propiedades.csv",
      toCsv(
        ["Referencia", "Título", "Operación", "Tipo", "Estado", "Precio", "m² construidos", "Habitaciones", "Baños", "Dirección", "Zona", "Población", "Agente", "Alta"],
        rows.map((p) => [p.ref, p.title, OPERATIONS[p.operation], PROPERTY_TYPES[p.type], PROPERTY_STATUS[p.status], p.price, p.areaBuilt, p.rooms, p.baths, p.address, p.zone, p.city, p.agentName, fmt(p.createdAt)]),
      ),
    );
  }
  if (kind === "clientes") {
    const { rows } = listClients({ ...sp, page: "1" }, 100000);
    return csvResponse(
      "clientes.csv",
      toCsv(
        ["Nombre", "Apellidos", "Email", "Teléfono", "DNI", "Tipo", "Origen", "Estado", "Busca", "Presupuesto máx.", "Zonas", "Agente", "RGPD", "Alta"],
        rows.map(({ c, pref, agentName }) => [c.name, c.surname, c.email, c.phone, c.dni, CLIENT_KINDS[c.kind], CLIENT_SOURCES[c.source], CLIENT_STATUS[c.status], pref?.operation ? OPERATIONS[pref.operation] : "", pref?.maxPrice, parseJsonArray(pref?.zones).join(", "), agentName, c.gdprConsent ? "Sí" : "No", fmt(c.createdAt)]),
      ),
    );
  }
  if (kind === "facturas") {
    if (!can(u, "ver_facturas")) return new Response("Prohibido", { status: 403 });
    const y = Number(sp.year) || new Date().getFullYear();
    const rows = db
      .select()
      .from(schema.invoices)
      .where(and(gte(schema.invoices.issueDate, fromMadrid(y, 1, 1)), lt(schema.invoices.issueDate, fromMadrid(y + 1, 1, 1)), u.role === "admin" ? undefined : eq(schema.invoices.agentId, u.id)))
      .orderBy(desc(schema.invoices.issueDate))
      .all();
    return csvResponse(
      `facturas-${y}.csv`,
      toCsv(
        ["Número", "Fecha", "Cliente", "NIF", "Base (€)", "IVA %", "IVA (€)", "Total (€)", "Estado", "Cobrada"],
        rows.map((i) => [i.number ?? "Borrador", fmt(i.issueDate), i.customerName, i.customerNif, i.subtotalCents / 100, i.vatRate, i.vatCents / 100, i.totalCents / 100, INVOICE_STATUS[i.status], i.paidAt ? fmt(i.paidAt) : ""]),
      ),
    );
  }
  return new Response("Not found", { status: 404 });
}
