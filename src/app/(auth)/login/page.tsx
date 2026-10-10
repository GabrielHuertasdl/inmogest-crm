import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Logo } from "@/components/layout/Logo";
import { LoginForm } from "./LoginForm";
import { APP_NAME } from "@/lib/constants";

export const metadata = { title: "Iniciar sesión" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSession()) redirect("/dashboard");
  const { next } = await searchParams;
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Logo />
          <h1 className="mt-10 text-2xl font-semibold">Bienvenido de nuevo</h1>
          <p className="mt-1 mb-8 text-sm text-muted">Accede a tu CRM inmobiliario</p>
          <LoginForm next={next} />
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-brand-600 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#6c93f8_0,transparent_45%),radial-gradient(circle_at_80%_80%,#263d82_0,transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-end p-16 text-white">
          <p className="max-w-md text-3xl leading-tight font-semibold">Gestiona propiedades, clientes y agenda desde un solo lugar.</p>
          <p className="mt-4 max-w-md text-brand-100">Cruces automáticos, publicación en portales, página web y facturación. {APP_NAME} lo reúne todo.</p>
        </div>
      </div>
    </div>
  );
}
