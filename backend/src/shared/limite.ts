// Contador de intentos por ventana de tiempo, por clave (p. ej. "login:<correo>"). Protege aunque alguien llame
// al API directamente sin pasar por Next (allá está el límite por IP).
// shortcut: en memoria de este proceso; con varias instancias del backend hay que pasarlo a un almacén compartido (p. ej. Redis).
const contadores = new Map<string, { n: number; hasta: number }>();

export const MINUTO = 60_000;

/** Intentos registrados en la ventana vigente (0 si venció). */
export function intentos(clave: string) {
  const v = contadores.get(clave);
  return v && v.hasta > Date.now() ? v.n : 0;
}

/** Suma un intento y devuelve cuántos van en la ventana. */
export function sumarIntento(clave: string, ventanaMs: number) {
  const ahora = Date.now();
  if (contadores.size > 10_000) for (const [k, v] of contadores) if (v.hasta <= ahora) contadores.delete(k);
  const v = contadores.get(clave);
  if (!v || v.hasta <= ahora) {
    contadores.set(clave, { n: 1, hasta: ahora + ventanaMs });
    return 1;
  }
  return ++v.n;
}

export const olvidarIntentos = (clave: string) => contadores.delete(clave);
