// Clean production database: agency row, one admin, portals and invoice series. No demo data.
// Usage: ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" tsx scripts/init.ts
// Prints nothing secret; the generated password is written to data/admin-password.txt (chmod 600).
import { writeFileSync, chmodSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { count } from "drizzle-orm";
import { db, schema, DATA_DIR } from "./db";
import { hashPassword } from "../src/lib/auth/password";
import { PORTALS } from "../src/lib/constants";

if ((db.select({ n: count() }).from(schema.users).get()?.n ?? 0) > 0) {
  console.error("La base de datos ya tiene usuarios. No se ha modificado nada.");
  process.exit(1);
}

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const name = (process.env.ADMIN_NAME ?? "Administrador").trim();
if (!email.includes("@")) {
  console.error("Define ADMIN_EMAIL");
  process.exit(1);
}
const password = randomBytes(12).toString("base64url");

db.insert(schema.agency).values({ id: 1, name: process.env.AGENCY_NAME ?? "Mi inmobiliaria", city: "Valencia", province: "Valencia", lat: 39.4699, lng: -0.3763, updatedAt: new Date() }).run();
db.insert(schema.users).values({ name, email, passwordHash: hashPassword(password), role: "admin", color: "#3463e6" }).run();
for (const p of PORTALS) db.insert(schema.portals).values({ key: p.key, name: p.name, enabled: false, feedToken: randomBytes(12).toString("hex") }).run();
db.insert(schema.invoiceSeries).values({ code: "F", description: "Facturas ordinarias", nextNumber: 1, isDefault: true }).run();
db.insert(schema.invoiceSeries).values({ code: "R", description: "Facturas rectificativas", nextNumber: 1 }).run();

const file = path.join(DATA_DIR, "admin-password.txt");
writeFileSync(file, `Usuario: ${email}\nContraseña: ${password}\n`);
chmodSync(file, 0o600);
console.log(`Base de datos creada. Usuario administrador: ${email}. Contraseña guardada en ${file}`);
