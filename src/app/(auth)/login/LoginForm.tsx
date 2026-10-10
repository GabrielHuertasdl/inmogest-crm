"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { login } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, null);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      {state?.error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>}
      <label className="block">
        <span className="label">Email</span>
        <span className="relative block">
          <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <input name="email" type="email" autoComplete="username" required className="input h-11 pl-10" placeholder="tu@agencia.com" />
        </span>
      </label>
      <label className="block">
        <span className="label">Contraseña</span>
        <span className="relative block">
          <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <input name="password" type={show ? "text" : "password"} autoComplete="current-password" required className="input h-11 pr-10 pl-10" placeholder="••••••••" />
          <button type="button" onClick={() => setShow(!show)} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted" aria-label="Mostrar contraseña">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </span>
      </label>
      <button disabled={pending} className="btn-primary h-11 w-full text-[15px]">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Iniciar sesión
      </button>
    </form>
  );
}
