export const APP_NAME = "Inmogest";
export const APP_VERSION = "1.0.0";

type Opt = { value: string; label: string };
const opts = (o: Record<string, string>): Opt[] => Object.entries(o).map(([value, label]) => ({ value, label }));
export const labelOf = (o: Record<string, string>, v: string | null | undefined) => (v ? (o[v] ?? v) : "—");

export const OPERATIONS: Record<string, string> = { venta: "Venta", alquiler: "Alquiler", traspaso: "Traspaso" };
export const PROPERTY_TYPES: Record<string, string> = {
  piso: "Piso",
  casa: "Casa",
  chalet: "Chalet",
  atico: "Ático",
  duplex: "Dúplex",
  estudio: "Estudio",
  local: "Local",
  oficina: "Oficina",
  nave: "Nave",
  terreno: "Terreno",
  garaje: "Garaje",
};
export const PROPERTY_STATUS: Record<string, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido",
  alquilado: "Alquilado",
  retirado: "Retirado",
  borrador: "Borrador",
};
export const STATUS_TONE: Record<string, string> = {
  disponible: "green",
  reservado: "amber",
  vendido: "blue",
  alquilado: "violet",
  retirado: "gray",
  borrador: "gray",
};
export const CONDITIONS: Record<string, string> = { nuevo: "Obra nueva", buen_estado: "Buen estado", a_reformar: "A reformar" };
export const ENERGY = ["A", "B", "C", "D", "E", "F", "G", "En trámite", "Exento"];
export const FEATURES: Record<string, string> = {
  ascensor: "Ascensor",
  terraza: "Terraza",
  balcon: "Balcón",
  piscina: "Piscina",
  garaje: "Plaza de garaje",
  trastero: "Trastero",
  aire: "Aire acondicionado",
  calefaccion: "Calefacción",
  jardin: "Jardín",
  amueblado: "Amueblado",
  exterior: "Exterior",
  armarios: "Armarios empotrados",
  portero: "Portero",
  vistas_mar: "Vistas al mar",
  accesible: "Accesible",
  mascotas: "Admite mascotas",
};

export const CLIENT_KINDS: Record<string, string> = {
  comprador: "Comprador",
  inquilino: "Inquilino",
  propietario: "Propietario",
  inversor: "Inversor",
  otro: "Otro",
};
export const CLIENT_SOURCES: Record<string, string> = {
  web: "Página web",
  portal: "Portal inmobiliario",
  telefono: "Teléfono",
  oficina: "Oficina",
  referido: "Referido",
  otro: "Otro",
};
export const CLIENT_STATUS: Record<string, string> = {
  nuevo: "Nuevo",
  activo: "Activo",
  en_negociacion: "En negociación",
  cerrado: "Cerrado",
  descartado: "Descartado",
};
export const CLIENT_STATUS_TONE: Record<string, string> = {
  nuevo: "blue",
  activo: "green",
  en_negociacion: "amber",
  cerrado: "violet",
  descartado: "gray",
};
export const INTEREST_STATUS: Record<string, string> = {
  propuesta: "Propuesta",
  interesado: "Interesado",
  visitado: "Visitado",
  descartado: "Descartado",
};

export const LEAD_STAGES: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  valoracion: "Valoración",
  negociacion: "Negociación",
  captado: "Captado",
  perdido: "Perdido",
};
export const LEAD_STAGE_TONE: Record<string, string> = {
  nuevo: "blue",
  contactado: "sky",
  valoracion: "violet",
  negociacion: "amber",
  captado: "green",
  perdido: "gray",
};

export const EVENT_KINDS: Record<string, string> = {
  llamada: "Llamada",
  reunion: "Reunión",
  visita: "Visita",
  firma: "Firma",
  tarea: "Tarea",
};
export const EVENT_COLORS: Record<string, string> = {
  llamada: "#2563eb",
  reunion: "#16a34a",
  visita: "#9333ea",
  firma: "#ca8a04",
  tarea: "#64748b",
};
export const REMINDERS: Record<string, string> = {
  "": "Sin recordatorio",
  "0": "A la hora del evento",
  "10": "10 minutos antes",
  "30": "30 minutos antes",
  "60": "1 hora antes",
  "1440": "1 día antes",
};
export const PRIORITIES: Record<string, string> = { baja: "Baja", media: "Media", alta: "Alta" };
export const PRIORITY_TONE: Record<string, string> = { baja: "gray", media: "amber", alta: "red" };

export const INVOICE_STATUS: Record<string, string> = {
  borrador: "Borrador",
  emitida: "Emitida",
  pagada: "Pagada",
  anulada: "Anulada",
};
export const INVOICE_STATUS_TONE: Record<string, string> = {
  borrador: "gray",
  emitida: "amber",
  pagada: "green",
  anulada: "red",
};

export const INTEREST_LEVELS: Record<string, string> = { bajo: "Bajo", medio: "Medio", alto: "Alto" };
export const CHANNELS: Record<string, string> = { web: "Web", interno: "Interno", email: "Email", portal: "Portal" };

export const ROLES: Record<string, string> = { admin: "Administrador", agente: "Agente" };
export const PERMISSIONS: Record<string, string> = {
  ver_facturas: "Ver facturas",
  editar_todo: "Editar registros de otros agentes",
  exportar: "Exportar datos",
  web: "Gestionar página web",
};

export const PORTALS: { key: string; name: string; format: "kyero" | "generic"; color: string }[] = [
  { key: "idealista", name: "Idealista", format: "generic", color: "#c3d600" },
  { key: "fotocasa", name: "Fotocasa", format: "generic", color: "#1e6bf0" },
  { key: "pisos", name: "Pisos.com", format: "generic", color: "#ef7d00" },
  { key: "indomio", name: "Indomio", format: "generic", color: "#e5004b" },
  { key: "habitaclia", name: "Habitaclia", format: "generic", color: "#00a0e3" },
  { key: "yaencontre", name: "Yaencontre", format: "generic", color: "#2bb24c" },
  { key: "kyero", name: "Kyero", format: "kyero", color: "#00264d" },
  { key: "thinkspain", name: "ThinkSpain", format: "kyero", color: "#cc0000" },
];

export const ZONE_ALIASES: Record<string, string[]> = {
  ruzafa: ["russafa"],
  "el cabanyal": ["cabanyal", "cabañal", "el cabañal"],
  "ciutat vella": ["ciudad vieja", "centro"],
};

export const toOptions = opts;
