import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/AppShell";
import { shellCounts } from "@/lib/queries/shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser();
  const collapsed = (await cookies()).get("ig_sidebar")?.value === "1";
  const { unread, todayEvents } = shellCounts(u);
  return (
    <AppShell user={{ id: u.id, name: u.name, email: u.email, role: u.role, color: u.color, avatarPath: u.avatarPath }} collapsed={collapsed} unread={unread} todayEvents={todayEvents}>
      {children}
    </AppShell>
  );
}
