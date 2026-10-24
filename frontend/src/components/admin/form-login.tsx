"use client";

import { useActionState } from "react";
import { iniciarSesion } from "@/app/admin/acciones";

export function FormLogin() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, { errores: [] });
  return (
    <form action={accion} className="space-y-4">
      <label className="block">
        <span className="etiqueta">Clave de administración</span>
        <input name="clave" type="password" required autoFocus autoComplete="current-password" className="campo" />
      </label>
      {estado.errores.length > 0 && <p role="alert" className="text-sm text-vino">{estado.errores[0]}</p>}
      <button disabled={enviando} className="boton-primario w-full">
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
