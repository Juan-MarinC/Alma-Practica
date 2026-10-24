"use server";

import { redirect } from "next/navigation";
import { API_URL } from "@/lib/api";
import { excedeLimite, ipCliente, MINUTO } from "@/lib/limite";

export type EstadoCheckout = { errores: string[] };

const WOMPI = "https://checkout.wompi.co/";

async function pedirPago(ruta: string, cuerpo?: unknown): Promise<EstadoCheckout> {
  // Frena la creación masiva de pedidos y de intentos de pago desde una misma IP.
  if (excedeLimite(`pago:${await ipCliente()}`, 20, 10 * MINUTO)) {
    return { errores: ["Hiciste muchos intentos seguidos. Espera unos minutos e intenta de nuevo."] };
  }
  let r: Response;
  try {
    r = await fetch(`${API_URL}${ruta}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      cache: "no-store",
    });
  } catch {
    return { errores: ["No pudimos conectar con la tienda. Intenta de nuevo en un momento."] };
  }
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) return { errores: Array.isArray(datos.errores) ? datos.errores : ["No pudimos procesar tu pedido. Intenta de nuevo."] };
  // Solo se redirige a la pasarela esperada.
  if (typeof datos.urlPago !== "string" || !datos.urlPago.startsWith(WOMPI)) return { errores: ["Respuesta inesperada al iniciar el pago."] };
  redirect(datos.urlPago);
}

// Al backend solo van SKU y cantidad: el precio lo calcula el servidor con el catálogo.
export async function crearPedido(_: EstadoCheckout, f: FormData): Promise<EstadoCheckout> {
  const texto = (k: string) => String(f.get(k) ?? "");
  const cantidades = f.getAll("cantidad");
  return pedirPago("/pedidos", {
    items: f.getAll("sku").map((sku, i) => ({ sku: String(sku), cantidad: Number(cantidades[i]) })),
    contacto: { nombre: texto("nombre"), email: texto("email"), telefono: texto("telefono"), aceptaDatos: f.get("aceptaDatos") === "on" },
    envio: { departamento: texto("departamento"), ciudad: texto("ciudad"), direccion: texto("direccion"), indicaciones: texto("indicaciones") },
  });
}

export async function reintentarPago(pedidoId: string): Promise<EstadoCheckout> {
  if (!/^[0-9a-f-]{36}$/i.test(pedidoId)) return { errores: ["Pedido inválido"] };
  return pedirPago(`/pedidos/${pedidoId}/pago`);
}
