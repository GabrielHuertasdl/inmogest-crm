// Deterministic demo data. Run with `pnpm reset` (wipes data/ first) or `pnpm seed` on an empty DB.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { count, eq as eqId } from "drizzle-orm";
import { db, schema, UPLOADS_DIR } from "./db";
import { hashPassword } from "../src/lib/auth/password";
import { PORTALS } from "../src/lib/constants";

if ((db.select({ n: count() }).from(schema.users).get()?.n ?? 0) > 0) {
  console.log("La base de datos ya tiene datos. Usa `pnpm reset` para empezar de cero.");
  process.exit(0);
}

// mulberry32
let seed = 20261011;
const rnd = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)]!;
const int = (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1));
const chance = (p: number) => rnd() < p;
const round = (v: number, step: number) => Math.round(v / step) * step;
const now = new Date();
const DAY = 86_400_000;
const daysFrom = (d: number, h = 10, m = 0) => {
  const x = new Date(now.getTime() + d * DAY);
  x.setHours(h, m, 0, 0);
  return x;
};

// Demo password: set SEED_PASSWORD, or a random one is generated and printed below.
const PASSWORD = process.env.SEED_PASSWORD ?? globalThis.crypto.randomUUID().slice(0, 12);
const pw = hashPassword(PASSWORD);

// ── agency ─────────────────────────────────────────────
db.insert(schema.agency)
  .values({
    id: 1,
    name: "Inmogest Demo",
    legalName: "Inmogest Demo S.L.",
    cif: "B12345678",
    email: "info@inmogestdemo.es",
    phone: "963 000 000",
    address: "Carrer de Colón, 22",
    city: "Valencia",
    province: "Valencia",
    postalCode: "46004",
    lat: 39.4699,
    lng: -0.3763,
    primaryColor: "#3463e6",
    accentColor: "#f59e0b",
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    linkedin: "https://linkedin.com/",
    websiteTitle: "Encuentra tu hogar en Valencia",
    websiteTagline: "Compra, vende o alquila con un equipo que conoce cada barrio.",
    aboutText:
      "Somos una agencia inmobiliaria con más de 15 años de experiencia en Valencia y su área metropolitana. Acompañamos a compradores, vendedores e inversores en cada paso: valoración, comercialización, negociación y firma.\n\nNuestro equipo combina conocimiento local con herramientas digitales para que cada operación sea rápida, transparente y segura.",
    updatedAt: now,
  })
  .run();

// ── users ──────────────────────────────────────────────
const USERS = [
  { name: "Gabriel Huertas", email: "admin@inmogest.local", role: "admin", color: "#3463e6", phone: "600 111 222" },
  { name: "Laura Martínez", email: "laura@inmogest.local", role: "agente", color: "#16a34a", phone: "600 222 333" },
  { name: "Carlos Ruiz", email: "carlos@inmogest.local", role: "agente", color: "#9333ea", phone: "600 333 444" },
  { name: "Marta Sánchez", email: "marta@inmogest.local", role: "agente", color: "#ea580c", phone: "600 444 555" },
];
const userIds = USERS.map((u) => db.insert(schema.users).values({ ...u, passwordHash: pw, permissions: u.role === "agente" ? '["ver_facturas","exportar"]' : "[]" }).returning({ id: schema.users.id }).get().id);

// ── portals & invoice series ───────────────────────────
const portalIds = PORTALS.map((p, i) =>
  db.insert(schema.portals).values({ key: p.key, name: p.name, enabled: i < 6, feedToken: randomBytes(12).toString("hex") }).returning({ id: schema.portals.id }).get().id,
);
const seriesF = db.insert(schema.invoiceSeries).values({ code: "F", description: "Facturas ordinarias", nextNumber: 1, isDefault: true }).returning().get();
db.insert(schema.invoiceSeries).values({ code: "R", description: "Facturas rectificativas", nextNumber: 1 }).run();

// ── geography ──────────────────────────────────────────
const ZONES = [
  { city: "Valencia", zone: "Ruzafa", lat: 39.4627, lng: -0.3755, cp: "46006", street: ["Carrer de Sueca", "Carrer de Cuba", "Carrer del Literat Azorín", "Carrer de Puerto Rico"] },
  { city: "Valencia", zone: "Benimaclet", lat: 39.4864, lng: -0.3592, cp: "46020", street: ["Carrer de Murta", "Carrer del Doctor Vicent Zaragozá", "Avinguda de Valladolid"] },
  { city: "Valencia", zone: "El Cabanyal", lat: 39.4686, lng: -0.3283, cp: "46011", street: ["Carrer de la Reina", "Carrer de Josep Benlliure", "Carrer de la Barraca"] },
  { city: "Valencia", zone: "Campanar", lat: 39.4806, lng: -0.3988, cp: "46015", street: ["Avinguda de les Corts Valencianes", "Carrer de Valle de la Ballestera", "Avinguda de Pius XII"] },
  { city: "Valencia", zone: "Patraix", lat: 39.4584, lng: -0.3936, cp: "46018", street: ["Carrer de Sant Josep Artesà", "Carrer de Llanera de Ranes", "Carrer de Fontanars dels Alforins"] },
  { city: "Valencia", zone: "Ciutat Vella", lat: 39.4753, lng: -0.3775, cp: "46001", street: ["Carrer de Cavallers", "Carrer de la Pau", "Plaça del Tossal", "Carrer de Quart"] },
  { city: "Valencia", zone: "Malilla", lat: 39.4479, lng: -0.3729, cp: "46026", street: ["Avinguda de Ausiàs March", "Carrer de Bernat Descoll", "Carrer del Músic Ayllón"] },
  { city: "Alboraya", zone: "Port Saplaya", lat: 39.5103, lng: -0.3214, cp: "46120", street: ["Carrer de la Mar", "Passeig de Sant Antoni"] },
  { city: "Paterna", zone: "La Canyada", lat: 39.5246, lng: -0.4795, cp: "46182", street: ["Carrer 7", "Carrer 228", "Carrer del Pinar"] },
  { city: "Torrent", zone: "El Vedat", lat: 39.4106, lng: -0.4826, cp: "46901", street: ["Avinguda del Vedat", "Carrer de la Muntanya"] },
];
const FEATURE_KEYS = ["ascensor", "terraza", "balcon", "piscina", "garaje", "trastero", "aire", "calefaccion", "jardin", "amueblado", "exterior", "armarios", "portero", "accesible", "mascotas"];

// ── placeholder photos (SVG) ───────────────────────────
const PALETTES = [
  ["#c7d2fe", "#6366f1"],
  ["#bae6fd", "#0284c7"],
  ["#bbf7d0", "#16a34a"],
  ["#fde68a", "#d97706"],
  ["#fecdd3", "#e11d48"],
  ["#ddd6fe", "#7c3aed"],
  ["#e2e8f0", "#475569"],
];
const ROOMS_LBL = ["Salón", "Cocina", "Dormitorio", "Baño", "Terraza", "Fachada"];
function photoSvg(ref: string, idx: number, p: string[]) {
  const label = ROOMS_LBL[idx % ROOMS_LBL.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient></defs>
<rect width="1200" height="800" fill="url(#g)"/>
<rect x="0" y="560" width="1200" height="240" fill="#000" opacity=".08"/>
<g fill="none" stroke="#fff" stroke-width="18" stroke-linejoin="round" opacity=".9" transform="translate(${430 + idx * 7} ${200 - idx * 5})">
<path d="M0 170 170 30l170 140v190a20 20 0 0 1-20 20H20A20 20 0 0 1 0 360Z"/><rect x="130" y="250" width="80" height="130"/><rect x="40" y="200" width="60" height="60"/><rect x="240" y="200" width="60" height="60"/></g>
<text x="60" y="740" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="#fff">${ref}</text>
<text x="1140" y="740" font-family="Arial, sans-serif" font-size="36" fill="#fff" text-anchor="end" opacity=".9">${label}</text>
</svg>`;
}

// ── properties ─────────────────────────────────────────
const TYPES_SALE = ["piso", "piso", "piso", "atico", "duplex", "casa", "chalet", "estudio", "local", "oficina", "garaje"] as const;
const TITLES: Record<string, string[]> = {
  piso: ["Piso luminoso", "Piso reformado", "Amplio piso familiar", "Piso con balcón", "Piso exterior"],
  atico: ["Ático con terraza", "Ático con vistas"],
  duplex: ["Dúplex moderno", "Dúplex con terraza"],
  casa: ["Casa de pueblo", "Casa adosada"],
  chalet: ["Chalet con piscina", "Chalet independiente"],
  estudio: ["Estudio céntrico", "Estudio reformado"],
  local: ["Local comercial", "Local a pie de calle"],
  oficina: ["Oficina en edificio representativo"],
  garaje: ["Plaza de garaje"],
};
const propIds: number[] = [];
const propRows: { id: number; operation: string; type: string; city: string; zone: string; price: number; rooms: number | null; agentId: number; status: string; lat: number; lng: number }[] = [];

for (let i = 1; i <= 60; i++) {
  const z = ZONES[i % ZONES.length]!;
  const outskirts = ["Alboraya", "Paterna", "Torrent"].includes(z.city);
  let type: string = pick(TYPES_SALE);
  if (outskirts && chance(0.5)) type = pick(["chalet", "casa", "chalet"]);
  const operation = type === "garaje" || type === "local" ? pick(["venta", "alquiler"]) : chance(0.32) ? "alquiler" : "venta";
  const area =
    type === "estudio" ? int(32, 48) : type === "garaje" ? int(11, 16) : type === "chalet" ? int(160, 360) : type === "casa" ? int(110, 220) : type === "local" ? int(60, 240) : type === "oficina" ? int(70, 180) : type === "atico" ? int(80, 160) : int(65, 140);
  const ppm = operation === "venta" ? (type === "garaje" ? 1600 : z.zone === "Ciutat Vella" || z.zone === "Ruzafa" ? int(3200, 4300) : outskirts ? int(1900, 2900) : int(2200, 3400)) : type === "garaje" ? 6 : int(11, 18);
  const price = operation === "venta" ? round(area * ppm, 1000) : round(area * ppm, 25);
  const living = !["local", "oficina", "garaje"].includes(type);
  const rooms = living ? (type === "estudio" ? 0 : Math.max(1, Math.min(6, Math.round(area / 32)))) : null;
  const baths = living ? Math.max(1, Math.min(4, Math.round(area / 70))) : type === "garaje" ? null : 1;
  const r = rnd();
  const status = i <= 8 ? (operation === "venta" ? "vendido" : "alquilado") : r < 0.1 ? "reservado" : r < 0.13 ? "retirado" : "disponible";
  const agentId = userIds[i % userIds.length]!;
  const feats = FEATURE_KEYS.filter(() => chance(0.3));
  if (type === "chalet" && !feats.includes("piscina")) feats.push("piscina", "jardin");
  if (type === "atico" && !feats.includes("terraza")) feats.push("terraza");
  const lat = z.lat + (rnd() - 0.5) * 0.012;
  const lng = z.lng + (rnd() - 0.5) * 0.014;
  const title = `${pick(TITLES[type] ?? ["Inmueble"])} en ${z.zone}`;
  const closedAt = status === "vendido" || status === "alquilado" ? daysFrom(-int(5, 330)) : null;
  const createdAt = closedAt ? new Date(closedAt.getTime() - int(30, 120) * DAY) : daysFrom(-int(0, 360));
  const ref = `IG-${String(i).padStart(4, "0")}`;
  const condition = pick(["buen_estado", "buen_estado", "nuevo", "a_reformar"]);
  const description = living
    ? `${title}. Vivienda de ${area} m² construidos con ${rooms === 0 ? "espacio diáfano" : `${rooms} ${rooms === 1 ? "dormitorio" : "dormitorios"}`} y ${baths} ${baths === 1 ? "baño" : "baños"}, situada en ${z.street[0]}, en pleno barrio de ${z.zone} (${z.city}).\n\nDistribución práctica, mucha luz natural y ${feats.length ? `equipada con ${feats.slice(0, 3).join(", ").replace(/_/g, " ")}` : "posibilidades de personalización"}. Zona con todos los servicios: comercios, colegios, transporte público y zonas verdes a pocos minutos.\n\nIdeal tanto para vivir como para inversión. ¡Solicita tu visita!`
    : `${title} de ${area} m² en ${z.zone} (${z.city}). Excelente ubicación con gran visibilidad y fácil acceso. Ideal para ${type === "garaje" ? "residentes de la zona" : "cualquier tipo de negocio"}.`;
  const row = db
    .insert(schema.properties)
    .values({
      ref,
      title,
      operation,
      type,
      status,
      price,
      communityFee: living ? int(30, 120) : null,
      areaBuilt: area,
      areaUseful: Math.round(area * 0.86),
      plotArea: type === "chalet" ? int(400, 1200) : null,
      rooms,
      baths,
      floor: living && !["casa", "chalet"].includes(type) ? String(int(1, 8)) : type === "local" ? "Bajo" : null,
      yearBuilt: int(1955, 2023),
      energyRating: pick(["A", "B", "C", "D", "E", "E", "F", "En trámite"]),
      condition,
      address: `${pick(z.street)}, ${int(1, 120)}`,
      city: z.city,
      zone: z.zone,
      province: "Valencia",
      postalCode: z.cp,
      lat,
      lng,
      showExactLocation: chance(0.4),
      description,
      features: JSON.stringify(feats),
      agentId,
      isShared: chance(0.15),
      sharedCommissionPct: 50,
      commissionPct: operation === "venta" ? pick([3, 3, 4, 5]) : 100,
      featured: chance(0.15),
      publishedWeb: status !== "retirado",
      closedAt,
      closedPrice: closedAt ? Math.round(price * (operation === "venta" ? 0.96 : 1)) : null,
      createdAt,
      updatedAt: createdAt,
    })
    .returning({ id: schema.properties.id })
    .get();
  propIds.push(row.id);
  propRows.push({ id: row.id, operation, type, city: z.city, zone: z.zone, price, rooms, agentId, status, lat, lng });

  const pal = PALETTES[i % PALETTES.length]!;
  const dir = path.join(UPLOADS_DIR, "properties", String(row.id));
  mkdirSync(dir, { recursive: true });
  const nPhotos = int(3, 6);
  for (let k = 0; k < nPhotos; k++) {
    const file = `seed-${k + 1}.svg`;
    writeFileSync(path.join(dir, file), photoSvg(ref, k, pal));
    db.insert(schema.propertyPhotos).values({ propertyId: row.id, path: `properties/${row.id}/${file}`, position: k, isCover: k === 0 }).run();
  }
  if (status === "disponible" || status === "reservado")
    for (const pid of portalIds.slice(0, 6)) if (chance(0.5)) db.insert(schema.propertyPortals).values({ propertyId: row.id, portalId: pid, publishedAt: createdAt }).run();
}

// ── clients ────────────────────────────────────────────
const FIRST = ["Lucía", "Javier", "Marta", "Diego", "Ana", "Pablo", "Elena", "Sergio", "Carmen", "David", "Paula", "Alejandro", "Sara", "Miguel", "Laura", "Andrés", "Irene", "Raúl", "Nuria", "Hugo", "Claudia", "Álvaro", "Cristina", "Jorge", "Alba"];
const LAST = ["García", "Martínez", "López", "Sánchez", "Pérez", "Gómez", "Fernández", "Moreno", "Jiménez", "Ruiz", "Navarro", "Torres", "Domínguez", "Vázquez", "Ramos", "Gil", "Serrano", "Blanco", "Molina", "Castillo"];
const clientIds: number[] = [];
const buyerIds: number[] = [];
for (let i = 0; i < 80; i++) {
  const name = pick(FIRST);
  const surname = `${pick(LAST)} ${pick(LAST)}`;
  const kind = i < 12 ? "propietario" : pick(["comprador", "comprador", "comprador", "inquilino", "inquilino", "inversor"]);
  const email = `${name}.${surname.split(" ")[0]}${i}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") + "@example.com";
  const c = db
    .insert(schema.clients)
    .values({
      name,
      surname,
      email,
      phone: `6${int(10, 99)} ${int(100, 999)} ${int(100, 999)}`,
      dni: `${int(10000000, 99999999)}${pick("TRWAGMYFPDXBNJZSQVHLCKE".split(""))}`,
      kind,
      source: pick(["web", "portal", "portal", "telefono", "oficina", "referido"]),
      status: pick(["nuevo", "activo", "activo", "activo", "en_negociacion", "cerrado", "descartado"]),
      agentId: userIds[i % userIds.length],
      notes: chance(0.4) ? pick(["Prefiere contacto por WhatsApp.", "Busca algo cerca de colegios.", "Tiene financiación pre-aprobada.", "Disponible por las tardes.", "Necesita vender antes de comprar."]) : null,
      gdprConsent: chance(0.85),
      createdAt: daysFrom(-int(0, 300)),
    })
    .returning({ id: schema.clients.id })
    .get();
  clientIds.push(c.id);
  if (kind === "comprador" || kind === "inquilino" || kind === "inversor") {
    buyerIds.push(c.id);
    const op = kind === "inquilino" ? "alquiler" : "venta";
    const max = op === "venta" ? round(int(140, 520) * 1000, 5000) : round(int(650, 1800), 50);
    const zones = Array.from(new Set([pick(ZONES).zone, pick(ZONES).zone])).slice(0, int(1, 2));
    db.insert(schema.clientPreferences)
      .values({
        clientId: c.id,
        operation: op,
        types: JSON.stringify(chance(0.3) ? ["piso", "atico"] : chance(0.5) ? ["piso"] : []),
        minPrice: op === "venta" ? round(max * 0.5, 5000) : null,
        maxPrice: max,
        minRooms: int(1, 3),
        minBaths: chance(0.5) ? 1 : null,
        minArea: chance(0.4) ? int(50, 90) : null,
        zones: JSON.stringify(zones),
        features: JSON.stringify(FEATURE_KEYS.filter(() => chance(0.1)).slice(0, 2)),
        active: true,
      })
      .run();
  }
}
// owners linked to some properties
for (let i = 0; i < 12; i++) {
  db.update(schema.properties).set({ ownerClientId: clientIds[i] }).where(sqlEq(propIds[i * 4]!)).run();
}
function sqlEq(id: number) {
  return eqId(schema.properties.id, id);
}

// a few interests
for (let i = 0; i < 25; i++) {
  db.insert(schema.clientPropertyInterest)
    .values({ clientId: pick(buyerIds), propertyId: pick(propIds), status: pick(["propuesta", "propuesta", "interesado", "visitado", "descartado"]), createdAt: daysFrom(-int(0, 60)) })
    .onConflictDoNothing()
    .run();
}

// ── leads (captaciones) ────────────────────────────────
for (let i = 0; i < 30; i++) {
  const z = pick(ZONES);
  const stage = i < 10 ? "captado" : pick(["nuevo", "nuevo", "contactado", "contactado", "valoracion", "negociacion", "perdido"]);
  const type = pick(["piso", "piso", "atico", "casa", "chalet", "local"]);
  const op = chance(0.75) ? "venta" : "alquiler";
  const created = daysFrom(-int(5, 360));
  const capturedAt = stage === "captado" ? new Date(created.getTime() + int(3, 40) * DAY) : null;
  db.insert(schema.leads)
    .values({
      ownerName: `${pick(FIRST)} ${pick(LAST)}`,
      phone: `6${int(10, 99)} ${int(100, 999)} ${int(100, 999)}`,
      email: chance(0.6) ? `propietario${i}@example.com` : null,
      address: `${pick(z.street)}, ${int(1, 90)}`,
      city: z.city,
      zone: z.zone,
      type,
      operation: op,
      expectedPrice: op === "venta" ? round(int(120, 480) * 1000, 5000) : round(int(600, 1500), 50),
      stage,
      agentId: userIds[i % userIds.length],
      propertyId: stage === "captado" ? propIds[30 + (i % 25)] : null,
      notes: pick([null, "Contactado por buzoneo.", "Referido por cliente anterior.", "Quiere valoración antes de decidir.", "Tiene prisa por vender."]),
      capturedAt: capturedAt && capturedAt < now ? capturedAt : capturedAt ? daysFrom(-1) : null,
      createdAt: created,
    })
    .run();
}

// ── events ─────────────────────────────────────────────
const KINDS = ["llamada", "reunion", "visita", "firma", "tarea"] as const;
const EV_TITLES: Record<string, string[]> = {
  llamada: ["Llamar a cliente", "Seguimiento telefónico", "Confirmar visita", "Llamada propietario"],
  reunion: ["Reunión con propietario", "Reunión de equipo", "Reunión en notaría", "Presentación de oferta"],
  visita: ["Visita con cliente", "Segunda visita", "Visita técnica"],
  firma: ["Firma de arras", "Firma en notaría", "Firma contrato de alquiler", "Firma de encargo"],
  tarea: ["Hacer fotos", "Actualizar anuncio", "Preparar documentación"],
};
const eventIds: number[] = [];
const mkEvent = (kind: string, start: Date, agentId: number, done: boolean) => {
  const pr = pick(propRows);
  const cl = pick(buyerIds);
  const ev = db
    .insert(schema.events)
    .values({
      kind,
      title: pick(EV_TITLES[kind]!),
      startsAt: start,
      endsAt: new Date(start.getTime() + (kind === "llamada" ? 15 : kind === "visita" ? 45 : 60) * 60000),
      location: kind === "visita" || kind === "firma" ? `${pr.zone}, ${pr.city}` : kind === "reunion" ? "Oficina" : null,
      details: chance(0.4) ? "Llevar documentación y llaves." : null,
      clientId: kind === "tarea" ? null : cl,
      propertyId: kind === "llamada" && chance(0.5) ? null : pr.id,
      agentId,
      reminderMinutes: pick([null, 10, 30, 60]),
      done,
    })
    .returning({ id: schema.events.id })
    .get();
  eventIds.push(ev.id);
};
for (let i = 0; i < 110; i++) {
  const d = int(-30, 30);
  if (d === 0) continue;
  mkEvent(pick(KINDS), daysFrom(d, int(9, 19), pick([0, 15, 30, 45])), pick(userIds), d < 0 && chance(0.8));
}
// today — every agent gets every KPI kind, some done
for (const uid of userIds) {
  mkEvent("llamada", daysFrom(0, 9, 30), uid, true);
  mkEvent("llamada", daysFrom(0, 12, 0), uid, false);
  mkEvent("llamada", daysFrom(0, 16, 30), uid, false);
  mkEvent("reunion", daysFrom(0, 11, 0), uid, uid === userIds[0]);
  mkEvent("visita", daysFrom(0, 17, 0), uid, false);
  if (uid !== userIds[3]) mkEvent("firma", daysFrom(0, 13, 0), uid, false);
}

// ── tasks ──────────────────────────────────────────────
const TASKS = ["Subir fotos nuevas", "Revisar nota simple", "Enviar propuesta a cliente", "Actualizar precio en portales", "Pedir certificado energético", "Llamar al notario", "Preparar contrato de arras", "Renovar encargo de venta", "Responder consultas web", "Organizar jornada de puertas abiertas"];
for (let i = 0; i < 40; i++) {
  const d = i < 8 ? 0 : int(-10, 20);
  const done = d < 0 ? chance(0.7) : d === 0 ? i < 2 : false;
  db.insert(schema.tasks)
    .values({
      title: pick(TASKS),
      description: chance(0.4) ? "Ver notas del cliente antes de hacerlo." : null,
      dueAt: daysFrom(d, int(9, 19)),
      priority: pick(["baja", "media", "media", "alta"]),
      done,
      doneAt: done ? daysFrom(d) : null,
      agentId: userIds[i % userIds.length],
      clientId: chance(0.4) ? pick(clientIds) : null,
      propertyId: chance(0.5) ? pick(propIds) : null,
    })
    .run();
}

// ── conversations & messages ───────────────────────────
const INQ = [
  "Hola, me interesa esta vivienda. ¿Sigue disponible? Me gustaría visitarla esta semana.",
  "Buenos días, ¿el precio es negociable? Tengo financiación aprobada.",
  "¿Admiten mascotas? Tengo un perro pequeño.",
  "Me gustaría saber los gastos de comunidad y el IBI.",
  "¿Podríamos ver el piso el sábado por la mañana?",
  "Estoy buscando algo similar pero con terraza, ¿tenéis algo?",
];
for (let i = 0; i < 16; i++) {
  const pr = pick(propRows);
  const cid = pick(buyerIds);
  const c = db.select().from(schema.clients).where(eqId(schema.clients.id, cid)).get()!;
  const unread = i < 5;
  const n = int(2, 5);
  const startAt = daysFrom(-int(0, 20), int(9, 20));
  const conv = db
    .insert(schema.conversations)
    .values({
      clientId: cid,
      subject: i % 4 === 3 ? "Consulta general" : `Consulta sobre ${(db.select({ r: schema.properties.ref }).from(schema.properties).where(eqId(schema.properties.id, pr.id)).get()!).r}`,
      channel: i % 5 === 4 ? "interno" : i % 3 === 2 ? "portal" : "web",
      propertyId: i % 4 === 3 ? null : pr.id,
      agentId: pr.agentId,
      lastMessageAt: startAt,
    })
    .returning()
    .get();
  let t = startAt.getTime();
  for (let k = 0; k < n; k++) {
    const incoming = k % 2 === 0;
    const last = k === n - 1 || (unread && k === n - 2);
    const dir = unread && last ? "entrante" : incoming ? "entrante" : "saliente";
    db.insert(schema.messages)
      .values({
        conversationId: conv.id,
        direction: dir,
        authorUserId: dir === "saliente" ? pr.agentId : null,
        body: dir === "entrante" ? pick(INQ) : pick(["¡Hola! Sí, sigue disponible. ¿Qué día le viene bien?", "Le envío la información por email. Cualquier duda, aquí estoy.", "Perfecto, le confirmo la visita.", "El propietario está abierto a escuchar ofertas."]),
        senderName: dir === "entrante" ? `${c.name} ${c.surname ?? ""}`.trim() : null,
        senderEmail: dir === "entrante" ? c.email : null,
        senderPhone: dir === "entrante" ? c.phone : null,
        readAt: dir === "entrante" && unread && last ? null : new Date(t + 60000),
        createdAt: new Date(t),
      })
      .run();
    t += int(1, 30) * 3600000;
  }
  db.update(schema.conversations).set({ lastMessageAt: new Date(t) }).where(eqId(schema.conversations.id, conv.id)).run();
}

// ── invoices ───────────────────────────────────────────
let nextNum = 1;
for (let i = 0; i < 26; i++) {
  const draft = i >= 24;
  const issue = draft ? daysFrom(-int(0, 5)) : daysFrom(-int(3, 360));
  const cid = pick(clientIds);
  const c = db.select().from(schema.clients).where(eqId(schema.clients.id, cid)).get()!;
  const pr = pick(propRows);
  const lines = [{ concept: `Honorarios de intermediación ${pr.operation === "venta" ? "compraventa" : "arrendamiento"} – ${pr.zone}`, quantity: 1, unit: pr.operation === "venta" ? round(pr.price * 0.03, 50) * 100 : pr.price * 100 }];
  if (chance(0.3)) lines.push({ concept: "Gestión de documentación", quantity: 1, unit: 15000 });
  const sub = lines.reduce((s, l) => s + l.quantity * l.unit, 0);
  const vat = Math.round(sub * 0.21);
  const year = issue.getFullYear();
  const status = draft ? "borrador" : issue.getTime() < now.getTime() - 30 * DAY ? (chance(0.9) ? "pagada" : "emitida") : pick(["emitida", "pagada"]);
  const inv = db
    .insert(schema.invoices)
    .values({
      seriesId: seriesF.id,
      number: draft ? null : `F${year}-${String(nextNum++).padStart(4, "0")}`,
      issueDate: issue,
      dueDate: new Date(issue.getTime() + 30 * DAY),
      clientId: cid,
      customerName: `${c.name} ${c.surname ?? ""}`.trim(),
      customerNif: c.dni,
      customerAddress: `${pick(ZONES[0]!.street)}, ${int(1, 80)} · 46006 Valencia`,
      propertyId: pr.id,
      agentId: pr.agentId,
      status,
      subtotalCents: sub,
      vatRate: 21,
      vatCents: vat,
      totalCents: sub + vat,
      paidAt: status === "pagada" ? new Date(issue.getTime() + int(1, 25) * DAY) : null,
      createdAt: issue,
    })
    .returning({ id: schema.invoices.id })
    .get();
  lines.forEach((l, k) => db.insert(schema.invoiceLines).values({ invoiceId: inv.id, concept: l.concept, quantity: l.quantity, unitPriceCents: l.unit, position: k }).run());
}
db.update(schema.invoiceSeries).set({ nextNumber: nextNum }).where(eqId(schema.invoiceSeries.id, seriesF.id)).run();

// ── visit reports ──────────────────────────────────────
for (let i = 0; i < 6; i++) {
  const pr = pick(propRows);
  db.insert(schema.visitReports)
    .values({
      propertyId: pr.id,
      clientId: pick(buyerIds),
      agentId: pr.agentId,
      visitedAt: daysFrom(-int(1, 40), int(10, 19)),
      rating: int(2, 5),
      feedback: pick(["Le gusta la distribución pero ve la cocina pequeña.", "Muy interesado, quiere segunda visita con su pareja.", "No le convence la zona.", "Le encaja, pedirá financiación."]),
      interestLevel: pick(["bajo", "medio", "alto"]),
      offerAmount: chance(0.3) ? round(pr.price * 0.93, 1000) : null,
    })
    .run();
}

console.log(`
Datos de demostración creados:
  ${propIds.length} propiedades · ${clientIds.length} clientes · 30 captaciones · ${eventIds.length} eventos · 40 tareas · 16 conversaciones · 26 facturas

Acceso:
  Administrador: admin@inmogest.local / ${PASSWORD}
  Agente:        laura@inmogest.local / ${PASSWORD}
`);
