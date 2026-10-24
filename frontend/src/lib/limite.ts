import { headers } from "next/headers";

// Límite de intentos por ventana de tiempo. Va en Next y no en el backend porque el API solo recibe peticiones del
// servidor de Next: allá todas las clientas tendrían la misma IP.
// shortcut: contadores en memoria de este proceso; con varias instancias de Next hay que pasarlos a un almacén compartido (p. ej. Redis).
const contadores = new Map<string, { n: number; hasta: number }>();

/** Cuenta un uso de `clave` y dice si ya pasó de `max` dentro de la ventana de `ventanaMs`. */
export function excedeLimite(clave: string, max: number, ventanaMs: number) {
  const ahora = Date.now();
  if (contadores.size > 10_000) for (const [k, v] of contadores) if (v.hasta <= ahora) contadores.delete(k);
  const v = contadores.get(clave);
  if (!v || v.hasta <= ahora) {
    contadores.set(clave, { n: 1, hasta: ahora + ventanaMs });
    return false;
  }
  return ++v.n > max;
}

// shortcut: confía en x-forwarded-for; sin un proxy delante (nginx, Vercel, Cloudflare) que la fije, la clienta puede falsearla.
// En producción Next siempre va detrás de uno. Se toma la última entrada: la que agrega el proxy.
export async function ipCliente() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",").at(-1)?.trim() || h.get("x-real-ip") || "desconocida";
}

export const MINUTO = 60_000;
