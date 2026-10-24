"use client";

import { useActionState, useState } from "react";
import type { EstadoFormulario } from "@/app/admin/acciones";
import { NOMBRES_ESTADO } from "@/app/admin/pedidos/etiqueta-estado";
import type { EstadoPedido } from "@/lib/admin";
import { sinReiniciar } from "@/lib/formularios";

// Mismas reglas que validarCambioEstado en el backend (allá se validan de verdad).
const SIGUIENTES: Record<EstadoPedido, EstadoPedido[]> = {
  pendiente_pago: ["cancelado"],
  pagado: ["preparando", "cancelado"],
  preparando: ["enviado", "cancelado"],
  enviado: ["entregado"],
  entregado: [],
  cancelado: [],
};

export function FormEstadoPedido({
  estado,
  accion,
}: {
  estado: EstadoPedido;
  accion: (e: EstadoFormulario, d: FormData) => Promise<EstadoFormulario>;
}) {
  const [resultado, enviar, enviando] = useActionState(accion, { errores: [] });
  const opciones = SIGUIENTES[estado];
  const [nuevo, setNuevo] = useState(opciones[0] ?? "");
  if (opciones.length === 0) return null;

  return (
    <form action={enviar} onSubmit={sinReiniciar(enviar)} className="tarjeta-admin space-y-4 text-sm">
      <h2 className="font-serif text-xl">Cambiar estado</h2>
      <select name="estado" value={nuevo} onChange={(e) => setNuevo(e.target.value as EstadoPedido)} className="campo">
        {opciones.map((o) => <option key={o} value={o}>{NOMBRES_ESTADO[o]}</option>)}
      </select>
      {nuevo === "enviado" && (
        <label className="block">
          <span className="etiqueta">Número de guía</span>
          <input name="guiaEnvio" required minLength={3} maxLength={60} className="campo" />
        </label>
      )}
      {nuevo === "cancelado" && (estado === "pagado" || estado === "preparando") && (
        <p className="text-xs text-vino">El stock vuelve al inventario. El reembolso del pago se hace desde el panel de Wompi.</p>
      )}
      {resultado.errores.length > 0 && <p role="alert" className="text-vino">{resultado.errores[0]}</p>}
      <button disabled={enviando} className="boton-primario w-full">{enviando ? "Guardando…" : "Guardar"}</button>
    </form>
  );
}
