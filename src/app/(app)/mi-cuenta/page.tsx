import { requireUser } from "@/lib/auth/guards";
import { Avatar, Badge, Card, PageHeader } from "@/components/ui";
import { ProfileForm, PasswordForm } from "@/components/ProfileForms";
import { ROLES, PERMISSIONS } from "@/lib/constants";
import { fmt } from "@/lib/format";

export const metadata = { title: "Mi cuenta" };

export default async function MyAccount() {
  const u = await requireUser();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Mi cuenta" />
      <div className="card mb-6 flex flex-wrap items-center gap-4 p-6">
        <Avatar name={u.name} color={u.color} size={64} src={u.avatarPath ? `/files/${u.avatarPath}` : null} />
        <div>
          <p className="text-lg font-semibold">{u.name}</p>
          <p className="text-sm text-muted">{u.email}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge tone={u.role === "admin" ? "violet" : "blue"}>{ROLES[u.role]}</Badge>
            {u.role !== "admin" && u.perms.map((p) => <Badge key={p}>{PERMISSIONS[p] ?? p}</Badge>)}
          </div>
        </div>
        <p className="ml-auto text-xs text-muted">Usuario desde {fmt(u.createdAt)}</p>
      </div>
      <div className="space-y-6">
        <Card title="Perfil">
          <ProfileForm name={u.name} phone={u.phone} color={u.color} hasAvatar={!!u.avatarPath} />
        </Card>
        <Card title="Seguridad" subtitle="Cambia tu contraseña de acceso">
          <PasswordForm />
        </Card>
      </div>
    </div>
  );
}
