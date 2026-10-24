"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { reintentarPago } from "@/app/(tienda)/checkout/acciones";
import { useCarrito } from "./carrito";

/** Mientras el pago está en proceso (PSE puede tardar), vuelve a consultar cada 5 segundos. */
export function RefrescarMientrasPendiente() {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}

/** Con el pago aprobado, la bolsa se vacía. */
export function VaciarCarrito() {
  const { vaciar, listo, items } = useCarrito();
  const hayItems = items.length > 0;
  useEffect(() => {
    if (listo && hayItems) vaciar(); // con la guarda no se repite: vaciar() cambia de identidad en cada render
  }, [listo, hayItems, vaciar]);
  return null;
}

export function BotonReintentar({ pedidoId }: { pedidoId: string }) {
  const [estado, enviar, enviando] = useActionState(() => reintentarPago(pedidoId), { errores: [] });
  return (
    <form action={enviar} className="mt-6">
      <button disabled={enviando} className="boton-primario">{enviando ? "Preparando…" : "Intentar pagar de nuevo"}</button>
      {estado.errores.length > 0 && <p role="alert" className="mt-3 text-sm text-vino">{estado.errores[0]}</p>}
    </form>
  );
}
