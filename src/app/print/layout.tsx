import { requireUser } from "@/lib/auth/guards";
import { PrintBar } from "@/components/PrintBar";

export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="min-h-dvh bg-slate-100 py-6 print:bg-white print:py-0">
      <PrintBar />
      <div className="mx-auto max-w-[860px] bg-white shadow-sm print:max-w-none print:shadow-none">{children}</div>
    </div>
  );
}
