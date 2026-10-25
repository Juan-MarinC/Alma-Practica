"use server";

import { redirect } from "next/navigation";
import { API_URL } from "@/lib/api";
import { apiCuenta, tokenCliente } from "@/lib/cuenta";
import { excedeLimite, ipCliente, MINUTO } from "@/lib/limite";

export type EstadoCheckout = { errores: string[] };

const WOMPI = "https://checkout.wompi.co/";

/** `despues` corre cuando el pedido ya se creó y justo antes de ir a pagar (p. ej. guardar la dirección). */
async function pedirPago(ruta: string, cuerpo?: unknown, despues?: () => Promise<unknown>): Promise<EstadoCheckout> {
  // Frena la creación masiva de pedidos y de intentos de pago desde una misma IP.
  if (excedeLimite(`pago:${await ipCliente()}`, 20, 10 * MINUTO)) {
    return { errores: ["Hiciste muchos intentos seguidos. Espera unos minutos e intenta de nuevo."] };
  }
  // Con sesión el pedido queda en la cuenta: el backend lo liga con este token, no con nada que mande el navegador.
  const token = await tokenCliente();
  let r: Response;
  try {
    r = await fetch(`${API_URL}${ruta}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
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
  await despues?.().catch(() => null); // un fallo al guardar la dirección no debe impedir pagar
  redirect(datos.urlPago);
}

// Al backend solo van SKU y cantidad: el precio lo calcula el servidor con el catálogo.
export async function crearPedido(_: EstadoCheckout, f: FormData): Promise<EstadoCheckout> {
  const texto = (k: string) => String(f.get(k) ?? "");
  const cantidades = f.getAll("cantidad");
  const envio = { departamento: texto("departamento"), ciudad: texto("ciudad"), direccion: texto("direccion"), indicaciones: texto("indicaciones") };
  const guardar = f.get("guardarDireccion") === "on" ? () => apiCuenta("/yo/direcciones", "POST", envio) : undefined;
  return pedirPago(
    "/pedidos",
    {
      items: f.getAll("sku").map((sku, i) => ({ sku: String(sku), cantidad: Number(cantidades[i]) })),
      contacto: { nombre: texto("nombre"), email: texto("email"), telefono: texto("telefono"), aceptaDatos: f.get("aceptaDatos") === "on" },
      envio,
    },
    guardar,
  );
}

export async function reintentarPago(pedidoId: string): Promise<EstadoCheckout> {
  if (!/^[0-9a-f-]{36}$/i.test(pedidoId)) return { errores: ["Pedido inválido"] };
  return pedirPago(`/pedidos/${pedidoId}/pago`);
}
