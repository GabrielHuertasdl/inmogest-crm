import { requireUser } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui";
import { CalendarView } from "@/components/calendar/CalendarView";
import { eventsBetween, tasksBetween } from "@/lib/queries/calendar";
import { agentOptions, clientOptions, propertyOptions } from "@/lib/queries/properties";
import { dayBounds, todayKey } from "@/lib/format";

export const metadata = { title: "Calendario" };

const add = (k: string, n: number) => {
  const [y, m, d] = k.split("-").map(Number);
  const x = new Date(Date.UTC(y!, m! - 1, d! + n));
  return x.toISOString().slice(0, 10);
};

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ view?: string; date?: string; agent?: string; kind?: string }> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const view = (["month", "week", "day", "list"].includes(sp.view ?? "") ? sp.view : "month") as "month" | "week" | "day" | "list";
  const today = todayKey();
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today;
  const isAdmin = u.role === "admin";
  const agent = isAdmin ? (sp.agent ?? "all") : String(u.id);
  const agentId = agent === "all" ? null : Number(agent);
  // generous window covering any view around the date
  let fromK: string, toK: string;
  if (view === "month") {
    fromK = add(`${date.slice(0, 7)}-01`, -7);
    toK = add(`${date.slice(0, 7)}-01`, 45);
  } else if (view === "week") {
    fromK = add(date, -7);
    toK = add(date, 8);
  } else if (view === "list") {
    fromK = date;
    toK = add(date, 30);
  } else {
    fromK = date;
    toK = add(date, 1);
  }
  const from = dayBounds(fromK).start;
  const to = dayBounds(toK).start;
  const kind = sp.kind ?? "";
  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader title="Calendario" subtitle="Llamadas, reuniones, visitas, firmas y tareas" />
      <CalendarView
        view={view}
        date={date}
        today={today}
        events={eventsBetween(from, to, agentId, kind || undefined)}
        tasks={kind && kind !== "tarea" ? [] : tasksBetween(from, to, agentId)}
        agents={agentOptions()}
        agent={agent}
        clients={clientOptions()}
        properties={propertyOptions()}
        isAdmin={isAdmin}
        userId={u.id}
        kind={kind}
      />
    </div>
  );
}
