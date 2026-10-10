"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Loader2, X, AlertTriangle, CheckCircle2 } from "lucide-react";

export type ActionState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string[] | undefined>; message?: string; data?: unknown } | null;
type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

export function SubmitButton({ children, className = "btn-primary", pendingText = "Guardando…", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} {...rest}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? pendingText : children}
    </button>
  );
}

export function FormAlert({ state }: { state: ActionState }) {
  if (!state) return null;
  if (state.error)
    return (
      <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
      </div>
    );
  if (state.ok && state.message)
    return (
      <div className="mb-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {state.message}
      </div>
    );
  return null;
}

/** Form bound to a server action with inline error display. Children may be a render function receiving field errors. */
export function ActionForm({
  action,
  children,
  className,
  onSuccess,
  resetOnSuccess,
  refresh,
}: {
  action: Action;
  children: React.ReactNode | ((fe: Record<string, string[] | undefined>, state: ActionState) => React.ReactNode);
  className?: string;
  onSuccess?: (s: ActionState) => void;
  resetOnSuccess?: boolean;
  refresh?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (state?.ok) {
      if (resetOnSuccess) ref.current?.reset();
      if (refresh) router.refresh();
      onSuccess?.(state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form ref={ref} action={formAction} className={className}>
      <FormAlert state={state} />
      {typeof children === "function" ? children(state?.fieldErrors ?? {}, state) : children}
    </form>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-[6vh] backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={clsx("w-full rounded-2xl bg-white shadow-xl", wide ? "max-w-3xl" : "max-w-lg")}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-ink" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/** Small form that posts hidden fields to an action; optional confirm prompt. */
export function ActionButton({
  action,
  fields,
  children,
  className = "btn-secondary btn-sm",
  confirm,
  title,
}: {
  action: Action | ((fd: FormData) => Promise<unknown>);
  fields?: Record<string, string | number | boolean | null | undefined>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
  title?: string;
}) {
  const [asking, setAsking] = useState(false);
  const [state, formAction] = useActionState(async (prev: ActionState, fd: FormData) => {
    const r = await (action as Action)(prev, fd);
    return (r ?? null) as ActionState;
  }, null);
  const router = useRouter();
  useEffect(() => {
    if (state?.ok) router.refresh();
    if (state?.error) alertToast(state.error);
  }, [state, router]);
  const form = (
    <form action={formAction} className="inline">
      {fields &&
        Object.entries(fields).map(([k, v]) => (v == null ? null : <input key={k} type="hidden" name={k} value={String(v)} />))}
      <InlineSubmit className={className} title={title}>
        {children}
      </InlineSubmit>
    </form>
  );
  if (!confirm) return form;
  return (
    <>
      <button type="button" className={className} title={title} onClick={() => setAsking(true)}>
        {children}
      </button>
      <Modal open={asking} onClose={() => setAsking(false)} title="Confirmar">
        <p className="mb-6 text-sm text-slate-600">{confirm}</p>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setAsking(false)}>
            Cancelar
          </button>
          <form action={(fd) => (setAsking(false), formAction(fd))}>
            {fields && Object.entries(fields).map(([k, v]) => (v == null ? null : <input key={k} type="hidden" name={k} value={String(v)} />))}
            <button className="btn-danger">Confirmar</button>
          </form>
        </div>
      </Modal>
    </>
  );
}

function InlineSubmit({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} title={title}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

export function alertToast(msg: string, tone: "error" | "ok" = "error") {
  if (typeof document === "undefined") return;
  const el = document.createElement("div");
  el.className = `fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm text-white shadow-lg ${tone === "error" ? "bg-red-600" : "bg-emerald-600"}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

export function AutoSubmitSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}

export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn-secondary btn-sm"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? "¡Copiado!" : label}
    </button>
  );
}
