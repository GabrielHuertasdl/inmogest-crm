import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui";
import { ClientForm, type ClientFormValues } from "@/components/ClientForm";
import { agentOptions, distinctZones } from "@/lib/queries/properties";
import { db, schema } from "@/db";

export const metadata = { title: "Añadir cliente" };

export default async function NewClient({ searchParams }: { searchParams: Promise<{ conversation?: string; kind?: string }> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const initial: ClientFormValues = { agentId: u.id, kind: sp.kind ?? "comprador", status: "nuevo", source: "oficina" };
  if (sp.conversation) {
    const conv = db.select().from(schema.conversations).where(eq(schema.conversations.id, Number(sp.conversation))).get();
    const msg = conv ? db.select().from(schema.messages).where(eq(schema.messages.conversationId, conv.id)).all().find((m) => m.direction === "entrante") : null;
    if (conv && msg) {
      const [name, ...rest] = (msg.senderName ?? "").split(" ");
      Object.assign(initial, { conversationId: conv.id, name, surname: rest.join(" "), email: msg.senderEmail, phone: msg.senderPhone, source: conv.channel === "web" ? "web" : conv.channel === "portal" ? "portal" : "otro", notes: msg.body });
    }
  }
  const zones = Array.from(new Set(distinctZones().flatMap((z) => [z.zone, z.city])));
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader title="Añadir cliente" back="/clientes" />
      <ClientForm initial={initial} agents={agentOptions()} isAdmin={u.role === "admin"} zoneSuggestions={zones} />
    </div>
  );
}
