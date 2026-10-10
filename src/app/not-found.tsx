import Link from "next/link";
export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center p-8 text-center">
      <div>
        <p className="text-5xl font-bold text-brand-600">404</p>
        <h1 className="mt-2 text-xl font-semibold">Página no encontrada</h1>
        <Link href="/dashboard" className="btn-primary mt-6">Ir al inicio</Link>
      </div>
    </div>
  );
}
