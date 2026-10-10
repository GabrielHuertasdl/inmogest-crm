"use client";

import { Printer, X } from "lucide-react";

export function PrintBar() {
  return (
    <div className="no-print mx-auto mb-4 flex max-w-[860px] justify-end gap-2 px-4">
      <button onClick={() => window.close()} className="btn-secondary">
        <X className="h-4 w-4" /> Cerrar
      </button>
      <button onClick={() => window.print()} className="btn-primary">
        <Printer className="h-4 w-4" /> Imprimir / Guardar PDF
      </button>
    </div>
  );
}
