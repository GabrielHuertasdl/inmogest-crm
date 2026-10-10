import type { Agency } from "@/db/schema";
import { LogoMark } from "@/components/layout/Logo";

export function PrintHeader({ agency, title, subtitle }: { agency: Agency | undefined; title: string; subtitle?: string }) {
  return (
    <header className="flex items-start justify-between gap-6 border-b border-line pb-5">
      <div className="flex items-center gap-3">
        {agency?.logoPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/files/${agency.logoPath}`} alt="" className="h-12 w-auto" />
        ) : (
          <LogoMark size={44} />
        )}
        <div className="text-sm">
          <p className="font-semibold">{agency?.name}</p>
          <p className="text-muted">{[agency?.address, agency?.city].filter(Boolean).join(", ")}</p>
          <p className="text-muted">{[agency?.phone, agency?.email].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xl font-bold">{title}</p>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
    </header>
  );
}
