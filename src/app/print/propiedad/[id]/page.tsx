import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { PrintHeader } from "@/components/PrintHeader";
import { getProperty } from "@/lib/queries/properties";
import { CONDITIONS, FEATURES, OPERATIONS, PROPERTY_TYPES } from "@/lib/constants";
import { euros, m2 } from "@/lib/format";

export const metadata = { title: "Ficha de propiedad" };

export default async function PrintProperty({ params }: { params: Promise<{ id: string }> }) {
  const p = getProperty(Number((await params).id));
  if (!p) notFound();
  const agency = db.select().from(schema.agency).get();
  return (
    <article className="space-y-6 p-10 text-sm">
      <PrintHeader agency={agency} title={p.ref} subtitle={`${PROPERTY_TYPES[p.type]} en ${OPERATIONS[p.operation]?.toLowerCase()}`} />
      <h1 className="text-2xl font-bold">{p.title}</h1>
      <p className="text-muted">{[p.showExactLocation ? p.address : null, p.zone, p.city].filter(Boolean).join(", ")}</p>
      <div className="grid grid-cols-3 gap-2">
        {p.photos.slice(0, 3).map((ph, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={ph.id} src={`/files/${ph.path}`} alt="" className={`w-full rounded-lg object-cover ${i === 0 ? "col-span-3 aspect-[16/8]" : "hidden"}`} />
        ))}
        {p.photos.slice(1, 4).map((ph) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={`s${ph.id}`} src={`/files/${ph.path}`} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
        ))}
      </div>
      <div className="flex items-end justify-between border-y border-line py-4">
        <p className="text-3xl font-bold">
          {euros(p.price)}
          {p.operation === "alquiler" && <span className="text-base font-normal">/mes</span>}
        </p>
        <p className="text-right">
          {[p.areaBuilt && `${p.areaBuilt} m²`, p.rooms != null && `${p.rooms} habitaciones`, p.baths != null && `${p.baths} baños`].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-x-6 gap-y-2">
        {[
          ["Sup. construida", m2(p.areaBuilt)],
          ["Sup. útil", m2(p.areaUseful)],
          ["Planta", p.floor ?? "—"],
          ["Año", p.yearBuilt ?? "—"],
          ["Cert. energético", p.energyRating ?? "—"],
          ["Estado", CONDITIONS[p.condition]],
        ].map(([k, v]) => (
          <p key={k as string}>
            <span className="text-muted">{k}:</span> <b>{v}</b>
          </p>
        ))}
      </div>
      {p.featureList.length > 0 && <p>{p.featureList.map((f) => FEATURES[f] ?? f).join(" · ")}</p>}
      {p.description && <p className="leading-relaxed whitespace-pre-line">{p.description}</p>}
      {p.agent && (
        <p className="border-t border-line pt-4 text-muted">
          Contacto: {p.agent.name} · {p.agent.phone ?? agency?.phone} · {p.agent.email}
        </p>
      )}
    </article>
  );
}
