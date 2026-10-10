"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";
import { toggleTask } from "@/app/(app)/tareas/actions";
import { useRouter } from "next/navigation";

export function TaskCheck({ id, done }: { id: number; done: boolean }) {
  const [opt, setOpt] = useOptimistic(done);
  const [, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={opt ? "Marcar como pendiente" : "Marcar como hecha"}
      onClick={() =>
        start(async () => {
          setOpt(!opt);
          const fd = new FormData();
          fd.set("id", String(id));
          await toggleTask(null, fd);
          router.refresh();
        })
      }
      className={clsx("grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition", opt ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-brand-500")}
    >
      {opt && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
    </button>
  );
}
