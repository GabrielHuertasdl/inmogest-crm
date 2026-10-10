import "server-only";
import { CONDITIONS, FEATURES, OPERATIONS, PROPERTY_TYPES } from "@/lib/constants";

export type DescInput = {
  type: string;
  operation: string;
  city?: string | null;
  zone?: string | null;
  areaBuilt?: number | null;
  rooms?: number | null;
  baths?: number | null;
  floor?: string | null;
  condition?: string | null;
  features?: string[];
  price?: number | null;
  title?: string | null;
  notes?: string | null;
};

const MODEL = "claude-haiku-5-5";

export async function generateDescription(input: DescInput, lang: "es" | "en" = "es"): Promise<{ text: string; source: "ia" | "plantilla" }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: key });
      const facts = JSON.stringify({ ...input, type: PROPERTY_TYPES[input.type] ?? input.type, operation: OPERATIONS[input.operation] ?? input.operation, features: input.features?.map((f) => FEATURES[f] ?? f) });
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 800,
        system:
          lang === "es"
            ? "Eres redactor de anuncios inmobiliarios en España. Escribe descripciones atractivas, honestas y concretas en español, de 120 a 180 palabras, en 2-3 párrafos, sin inventar datos que no estén en la ficha, sin emojis ni mayúsculas excesivas. Devuelve solo el texto."
            : "You write Spanish real-estate listings in English for international buyers. 120–180 words, 2–3 paragraphs, factual, no invented details, no emojis. Return only the text.",
        messages: [{ role: "user", content: `Datos del inmueble:\n${facts}` }],
      });
      const text = res.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { text: string }).text)
        .join("\n")
        .trim();
      if (text) return { text, source: "ia" };
    } catch (e) {
      console.error("AI description failed, using template", e);
    }
  }
  return { text: templateDescription(input, lang), source: "plantilla" };
}

function pick<T>(a: T[], seed: number) {
  return a[Math.abs(seed) % a.length]!;
}

export function templateDescription(i: DescInput, lang: "es" | "en" = "es") {
  const seed = (i.areaBuilt ?? 0) + (i.rooms ?? 0) * 7 + (i.price ?? 0);
  const t = (PROPERTY_TYPES[i.type] ?? "Inmueble").toLowerCase();
  const where = [i.zone, i.city].filter(Boolean).join(", ");
  const feats = (i.features ?? []).map((f) => (FEATURES[f] ?? f).toLowerCase());
  if (lang === "en") {
    const op = i.operation === "alquiler" ? "for rent" : "for sale";
    return [
      `${cap(t)} ${op}${where ? ` in ${where}` : ""}${i.areaBuilt ? `, with ${i.areaBuilt} m² built` : ""}.`,
      i.rooms != null ? `It offers ${i.rooms} bedroom${i.rooms === 1 ? "" : "s"}${i.baths ? ` and ${i.baths} bathroom${i.baths === 1 ? "" : "s"}` : ""}.` : "",
      feats.length ? `Highlights include ${listEn(feats)}.` : "",
      "\n\nGreat location with shops, schools and public transport nearby. Contact us to arrange a viewing.",
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/ \n/g, "\n");
  }
  const op = i.operation === "alquiler" ? "en alquiler" : i.operation === "traspaso" ? "en traspaso" : "en venta";
  const intro = pick(
    [
      `Te presentamos este ${t} ${op}${where ? ` en ${where}` : ""}`,
      `Magnífico ${t} ${op}${where ? ` situado en ${where}` : ""}`,
      `Descubre este ${t} ${op}${where ? ` en pleno ${i.zone ?? i.city}` : ""}`,
    ],
    seed,
  );
  const size = i.areaBuilt ? `, con ${i.areaBuilt} m² construidos` : "";
  const dist =
    i.rooms != null && i.rooms > 0
      ? ` Dispone de ${i.rooms} ${i.rooms === 1 ? "dormitorio" : "dormitorios"}${i.baths ? ` y ${i.baths} ${i.baths === 1 ? "baño" : "baños"}` : ""}, con una distribución funcional y aprovechada.`
      : i.rooms === 0
        ? " Espacio diáfano de distribución abierta, ideal para optimizar cada metro."
        : "";
  const cond = i.condition ? ` Se encuentra en ${CONDITIONS[i.condition]?.toLowerCase() === "obra nueva" ? "estado de obra nueva" : (CONDITIONS[i.condition] ?? "").toLowerCase()}.` : "";
  const fl = i.floor ? ` Situado en planta ${i.floor}.` : "";
  const ex = feats.length ? `\n\nEntre sus características destacan: ${listEs(feats)}.` : "";
  const outro = pick(
    [
      "\n\nZona bien comunicada, con comercios, colegios y transporte público a pocos minutos. ¡No dejes pasar esta oportunidad y solicita tu visita!",
      "\n\nUn entorno tranquilo con todos los servicios al alcance. Contacta con nosotros para más información o para concertar una visita.",
      "\n\nIdeal tanto para vivir como para invertir. Llámanos y te lo enseñamos sin compromiso.",
    ],
    seed >> 3,
  );
  return `${intro}${size}.${dist}${cond}${fl}${ex}${outro}`.trim();
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const listEs = (a: string[]) => (a.length > 1 ? `${a.slice(0, -1).join(", ")} y ${a.at(-1)}` : a[0]);
const listEn = (a: string[]) => (a.length > 1 ? `${a.slice(0, -1).join(", ")} and ${a.at(-1)}` : a[0]);
