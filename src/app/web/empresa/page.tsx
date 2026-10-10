import { publicAgency, publicAgents } from "@/lib/queries/public";
import { MapView } from "@/components/maps";

export const metadata = { title: "Quiénes somos" };

export default function About() {
  const a = publicAgency();
  const agents = publicAgents();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Quiénes somos</h1>
      <div className="grid gap-10 lg:grid-cols-2">
        <p className="leading-relaxed whitespace-pre-line text-slate-700">{a.aboutText ?? `${a.name} es tu agencia inmobiliaria de confianza.`}</p>
        {a.lat != null && a.lng != null && <MapView center={[a.lat, a.lng]} zoom={15} pins={[{ id: "office", lat: a.lat, lng: a.lng, color: a.primaryColor, label: a.name }]} height={320} />}
      </div>
      <h2 className="mt-16 mb-6 text-2xl font-bold text-slate-900">Nuestro equipo</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {agents.map((g) => (
          <div key={g.id} className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
            {g.avatarPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/files/${g.avatarPath}`} alt={g.name} className="mx-auto h-24 w-24 rounded-full object-cover" />
            ) : (
              <span className="mx-auto grid h-24 w-24 place-items-center rounded-full text-2xl font-semibold text-white" style={{ background: g.color }}>
                {g.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
            )}
            <p className="mt-4 font-semibold text-slate-900">{g.name}</p>
            {g.phone && <p className="text-sm text-slate-500">{g.phone}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
