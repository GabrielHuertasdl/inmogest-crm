"use client";

import { useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { sendMessage, markRead } from "@/app/(app)/mensajes/actions";

export function ReadMarker({ id, hasUnread }: { id: number; hasUnread: boolean }) {
  useEffect(() => {
    if (hasUnread) markRead(id);
  }, [id, hasUnread]);
  return null;
}

export function ScrollBottom() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.scrollIntoView({ block: "end" }), []);
  return <div ref={ref} />;
}

export function ReplyBox({ conversationId, templates }: { conversationId: number; templates: string[] }) {
  return (
    <ActionForm action={sendMessage} resetOnSuccess refresh className="border-t border-line p-4">
      <input type="hidden" name="conversationId" value={conversationId} />
      <textarea
        name="body"
        rows={3}
        className="input"
        placeholder="Escribe tu respuesta…"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) e.currentTarget.form?.requestSubmit();
        }}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select
          className="input h-9 w-auto py-1 text-xs"
          defaultValue=""
          onChange={(e) => {
            const ta = e.currentTarget.form?.querySelector("textarea");
            if (ta && e.target.value) ta.value = e.target.value;
            e.target.value = "";
          }}
          aria-label="Plantillas"
        >
          <option value="">Respuestas rápidas…</option>
          {templates.map((t) => (
            <option key={t} value={t}>
              {t.slice(0, 60)}…
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" name="internal" className="h-4 w-4 accent-amber-500" /> Nota interna (no visible para el cliente)
        </label>
        <span className="ml-auto text-xs text-muted">Ctrl + Enter para enviar</span>
        <SubmitButton className="btn-primary btn-sm" pendingText="Enviando…">
          <Send className="h-4 w-4" /> Enviar
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
