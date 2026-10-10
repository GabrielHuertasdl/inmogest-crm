import { sqliteTable, integer, text, real, primaryKey, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const ts = (name: string) => integer(name, { mode: "timestamp" });
const bool = (name: string) => integer(name, { mode: "boolean" });
const created = () => ts("created_at").notNull().default(sql`(unixepoch())`);

export const agency = sqliteTable("agency", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  cif: text("cif"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  province: text("province"),
  postalCode: text("postal_code"),
  lat: real("lat"),
  lng: real("lng"),
  logoPath: text("logo_path"),
  primaryColor: text("primary_color").notNull().default("#2563eb"),
  accentColor: text("accent_color").notNull().default("#f59e0b"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  linkedin: text("linkedin"),
  x: text("x"),
  websiteTitle: text("website_title"),
  websiteTagline: text("website_tagline"),
  aboutText: text("about_text"),
  showCheapest: bool("show_cheapest").notNull().default(true),
  defaultVat: real("default_vat").notNull().default(21),
  updatedAt: ts("updated_at"),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("agente"),
  phone: text("phone"),
  avatarPath: text("avatar_path"),
  color: text("color").notNull().default("#2563eb"),
  active: bool("active").notNull().default(true),
  permissions: text("permissions").notNull().default("[]"),
  createdAt: created(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: ts("expires_at").notNull(),
  createdAt: created(),
});

export const clients = sqliteTable(
  "clients",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    surname: text("surname"),
    email: text("email"),
    phone: text("phone"),
    phone2: text("phone2"),
    dni: text("dni"),
    address: text("address"),
    kind: text("kind").notNull().default("comprador"),
    source: text("source").notNull().default("oficina"),
    status: text("status").notNull().default("nuevo"),
    agentId: integer("agent_id").references(() => users.id, { onDelete: "set null" }),
    notes: text("notes"),
    gdprConsent: bool("gdpr_consent").notNull().default(false),
    createdAt: created(),
  },
  (t) => [index("clients_agent_idx").on(t.agentId), index("clients_kind_idx").on(t.kind)],
);

export const clientPreferences = sqliteTable("client_preferences", {
  clientId: integer("client_id")
    .primaryKey()
    .references(() => clients.id, { onDelete: "cascade" }),
  operation: text("operation"),
  types: text("types").notNull().default("[]"),
  minPrice: integer("min_price"),
  maxPrice: integer("max_price"),
  minRooms: integer("min_rooms"),
  minBaths: integer("min_baths"),
  minArea: integer("min_area"),
  zones: text("zones").notNull().default("[]"),
  features: text("features").notNull().default("[]"),
  active: bool("active").notNull().default(true),
});

export const leads = sqliteTable(
  "leads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ownerName: text("owner_name").notNull(),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    city: text("city"),
    zone: text("zone"),
    type: text("type"),
    operation: text("operation"),
    expectedPrice: integer("expected_price"),
    stage: text("stage").notNull().default("nuevo"),
    agentId: integer("agent_id").references(() => users.id, { onDelete: "set null" }),
    propertyId: integer("property_id"),
    notes: text("notes"),
    capturedAt: ts("captured_at"),
    createdAt: created(),
  },
  (t) => [index("leads_stage_idx").on(t.stage, t.agentId)],
);

export const properties = sqliteTable(
  "properties",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ref: text("ref").notNull().unique(),
    title: text("title").notNull(),
    operation: text("operation").notNull().default("venta"),
    type: text("type").notNull().default("piso"),
    status: text("status").notNull().default("disponible"),
    price: integer("price").notNull().default(0),
    communityFee: integer("community_fee"),
    areaBuilt: integer("area_built"),
    areaUseful: integer("area_useful"),
    plotArea: integer("plot_area"),
    rooms: integer("rooms"),
    baths: integer("baths"),
    floor: text("floor"),
    yearBuilt: integer("year_built"),
    energyRating: text("energy_rating"),
    condition: text("condition").notNull().default("buen_estado"),
    address: text("address"),
    city: text("city"),
    zone: text("zone"),
    province: text("province"),
    postalCode: text("postal_code"),
    lat: real("lat"),
    lng: real("lng"),
    showExactLocation: bool("show_exact_location").notNull().default(false),
    description: text("description"),
    descriptionEn: text("description_en"),
    features: text("features").notNull().default("[]"),
    agentId: integer("agent_id").references(() => users.id, { onDelete: "set null" }),
    ownerClientId: integer("owner_client_id").references(() => clients.id, { onDelete: "set null" }),
    leadId: integer("lead_id"),
    isShared: bool("is_shared").notNull().default(false),
    sharedCommissionPct: real("shared_commission_pct"),
    commissionPct: real("commission_pct").notNull().default(3),
    featured: bool("featured").notNull().default(false),
    publishedWeb: bool("published_web").notNull().default(true),
    closedAt: ts("closed_at"),
    closedPrice: integer("closed_price"),
    createdAt: created(),
    updatedAt: ts("updated_at"),
  },
  (t) => [
    index("prop_filters_idx").on(t.status, t.operation, t.type, t.city),
    index("prop_agent_idx").on(t.agentId),
  ],
);

export const propertyPhotos = sqliteTable("property_photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  position: integer("position").notNull().default(0),
  isCover: bool("is_cover").notNull().default(false),
});

export const portals = sqliteTable("portals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  enabled: bool("enabled").notNull().default(false),
  feedToken: text("feed_token").notNull(),
  lastGeneratedAt: ts("last_generated_at"),
});

export const propertyPortals = sqliteTable(
  "property_portals",
  {
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    portalId: integer("portal_id")
      .notNull()
      .references(() => portals.id, { onDelete: "cascade" }),
    publishedAt: created(),
  },
  (t) => [primaryKey({ columns: [t.propertyId, t.portalId] })],
);

export const clientPropertyInterest = sqliteTable(
  "client_property_interest",
  {
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("propuesta"),
    createdAt: created(),
  },
  (t) => [primaryKey({ columns: [t.clientId, t.propertyId] })],
);

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind").notNull().default("reunion"),
    title: text("title").notNull(),
    startsAt: ts("starts_at").notNull(),
    endsAt: ts("ends_at"),
    allDay: bool("all_day").notNull().default(false),
    location: text("location"),
    details: text("details"),
    clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
    propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
    agentId: integer("agent_id").references(() => users.id, { onDelete: "set null" }),
    reminderMinutes: integer("reminder_minutes"),
    notifyAll: bool("notify_all").notNull().default(false),
    done: bool("done").notNull().default(false),
    createdAt: created(),
  },
  (t) => [index("events_start_idx").on(t.startsAt), index("events_agent_idx").on(t.agentId)],
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    dueAt: ts("due_at"),
    priority: text("priority").notNull().default("media"),
    done: bool("done").notNull().default(false),
    doneAt: ts("done_at"),
    agentId: integer("agent_id").references(() => users.id, { onDelete: "set null" }),
    clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
    propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
    createdAt: created(),
  },
  (t) => [index("tasks_due_idx").on(t.dueAt, t.agentId)],
);

export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  subject: text("subject").notNull(),
  channel: text("channel").notNull().default("web"),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
  agentId: integer("agent_id").references(() => users.id, { onDelete: "set null" }),
  lastMessageAt: ts("last_message_at").notNull(),
});

export const messages = sqliteTable(
  "messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    direction: text("direction").notNull().default("entrante"),
    authorUserId: integer("author_user_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    senderName: text("sender_name"),
    senderEmail: text("sender_email"),
    senderPhone: text("sender_phone"),
    readAt: ts("read_at"),
    createdAt: created(),
  },
  (t) => [index("messages_read_idx").on(t.readAt)],
);

export const invoiceSeries = sqliteTable("invoice_series", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  description: text("description"),
  nextNumber: integer("next_number").notNull().default(1),
  isDefault: bool("is_default").notNull().default(false),
});

export const invoices = sqliteTable(
  "invoices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    seriesId: integer("series_id")
      .notNull()
      .references(() => invoiceSeries.id),
    number: text("number").unique(),
    issueDate: ts("issue_date").notNull(),
    dueDate: ts("due_date"),
    clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    customerNif: text("customer_nif"),
    customerAddress: text("customer_address"),
    propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
    agentId: integer("agent_id").references(() => users.id, { onDelete: "set null" }),
    status: text("status").notNull().default("borrador"),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    vatRate: real("vat_rate").notNull().default(21),
    vatCents: integer("vat_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    notes: text("notes"),
    paidAt: ts("paid_at"),
    createdAt: created(),
  },
  (t) => [index("inv_date_idx").on(t.issueDate, t.status)],
);

export const invoiceLines = sqliteTable("invoice_lines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  concept: text("concept").notNull(),
  quantity: real("quantity").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull().default(0),
  position: integer("position").notNull().default(0),
});

export const visitReports = sqliteTable("visit_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  agentId: integer("agent_id").references(() => users.id, { onDelete: "set null" }),
  eventId: integer("event_id").references(() => events.id, { onDelete: "set null" }),
  visitedAt: ts("visited_at").notNull(),
  rating: integer("rating"),
  feedback: text("feedback"),
  interestLevel: text("interest_level").notNull().default("medio"),
  offerAmount: integer("offer_amount"),
  signaturePng: text("signature_png"),
  clientDni: text("client_dni"),
  createdAt: created(),
});

export const valuations = sqliteTable("valuations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
  ownerName: text("owner_name"),
  address: text("address"),
  city: text("city"),
  zone: text("zone"),
  type: text("type").notNull(),
  operation: text("operation").notNull(),
  area: integer("area").notNull(),
  rooms: integer("rooms"),
  baths: integer("baths"),
  condition: text("condition").notNull().default("buen_estado"),
  comparableIds: text("comparable_ids").notNull().default("[]"),
  pricePerM2Median: real("price_per_m2_median"),
  estimatedLow: integer("estimated_low"),
  estimated: integer("estimated"),
  estimatedHigh: integer("estimated_high"),
  agentId: integer("agent_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: created(),
});

export type User = typeof users.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type ClientPref = typeof clientPreferences.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Agency = typeof agency.$inferSelect;
