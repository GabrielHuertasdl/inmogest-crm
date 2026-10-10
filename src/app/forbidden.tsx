import Link from "next/link";
export default function Forbidden() {
  return (
    <div className="grid min-h-[60vh] place-items-center p-8 text-center">
      <div>
        <p className="text-5xl font-bold text-brand-600">403</p>
        <h1 className="mt-2 text-xl font-semibold">No tienes permiso</h1>
        <p className="mt-1 text-sm text-muted">Esta sección solo está disponible para administradores.</p>
        <Link href="/dashboard" className="btn-primary mt-6">Volver a la vista general</Link>
      </div>
    </div>
  );
}
