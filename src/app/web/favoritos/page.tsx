import { FavoritesList } from "@/components/web/client";

export const metadata = { title: "Mis favoritos" };

export default function Favs() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold text-slate-900">Mis favoritos</h1>
      <p className="mb-8 text-slate-500">Las propiedades que has guardado en este navegador.</p>
      <FavoritesList />
    </div>
  );
}
