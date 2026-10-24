import { createHash, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { FirmaInvalida, PasarelaNoConfigurada, type PasarelaPagos, type Transaccion } from '../../domain/pago.js';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

/** Firma de integridad del Web Checkout: SHA256(referencia + monto + moneda + secreto). */
export function firmaIntegridad(referencia: string, montoCentavos: number, moneda: string, secreto: string) {
  return sha256(`${referencia}${montoCentavos}${moneda}${secreto}`);
}

/** Checksum de eventos: SHA256(valores de signature.properties en orden + timestamp + secreto de eventos). */
export function checksumEvento(evento: { data?: unknown; signature?: { properties?: unknown }; timestamp?: unknown }, secreto: string) {
  const propiedades = evento.signature?.properties;
  if (!Array.isArray(propiedades) || propiedades.length === 0) return null;
  const valores = propiedades.map((ruta) =>
    String(ruta)
      .split('.')
      .reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), evento.data),
  );
  if (valores.some((v) => v === undefined || v === null)) return null;
  return sha256(`${valores.join('')}${String(evento.timestamp)}${secreto}`);
}

function aTransaccion(t: unknown): Transaccion | null {
  const x = (t ?? {}) as Record<string, unknown>;
  if (typeof x.id !== 'string' || typeof x.reference !== 'string' || typeof x.status !== 'string') return null;
  if (!Number.isInteger(x.amount_in_cents) || typeof x.currency !== 'string') return null;
  return {
    id: x.id,
    referencia: x.reference,
    estado: x.status,
    montoCentavos: x.amount_in_cents as number,
    moneda: x.currency,
    metodo: typeof x.payment_method_type === 'string' ? x.payment_method_type : null,
  };
}

// Adaptador de Wompi. Las llaves viven solo en el entorno (backend/.env), nunca en el código ni en el navegador.
@Injectable()
export class PasarelaWompi implements PasarelaPagos {
  private get llaves() {
    return {
      publica: process.env.WOMPI_LLAVE_PUBLICA ?? '',
      privada: process.env.WOMPI_LLAVE_PRIVADA ?? '',
      integridad: process.env.WOMPI_SECRETO_INTEGRIDAD ?? '',
      eventos: process.env.WOMPI_SECRETO_EVENTOS ?? '',
      api: process.env.WOMPI_API_URL ?? 'https://sandbox.wompi.co/v1',
    };
  }

  configurada() {
    const { publica, integridad, eventos } = this.llaves;
    return !!publica && !!integridad && !!eventos;
  }

  urlCheckout({ referencia, montoCentavos, urlRetorno }: { referencia: string; montoCentavos: number; urlRetorno: string }) {
    if (!this.configurada()) throw new PasarelaNoConfigurada();
    const { publica, integridad } = this.llaves;
    // Sin datos de la clienta en la URL: Wompi los pide en su propio formulario.
    const q = new URLSearchParams({
      'public-key': publica,
      currency: 'COP',
      'amount-in-cents': String(montoCentavos),
      reference: referencia,
      'signature:integrity': firmaIntegridad(referencia, montoCentavos, 'COP', integridad),
      'redirect-url': urlRetorno,
    });
    return `https://checkout.wompi.co/p/?${q}`;
  }

  leerEvento(cuerpo: unknown) {
    if (!this.configurada()) throw new PasarelaNoConfigurada();
    const evento = (cuerpo ?? {}) as {
      event?: unknown;
      data?: { transaction?: unknown };
      signature?: { checksum?: unknown; properties?: unknown };
      timestamp?: unknown;
    };
    const esperado = checksumEvento(evento, this.llaves.eventos);
    const recibido = String(evento.signature?.checksum ?? '').toLowerCase();
    if (!esperado || recibido.length !== esperado.length || !timingSafeEqual(Buffer.from(recibido), Buffer.from(esperado)))
      throw new FirmaInvalida();
    if (evento.event !== 'transaction.updated') return null;
    return aTransaccion(evento.data?.transaction);
  }

  // Con la llave privada Wompi solo responde transacciones de este comercio: sin ella, un id de una transacción
  // pagada en otro comercio con nuestra referencia y monto podría marcar un pedido como pagado. Sin llave no se
  // consulta nada (falla cerrado) y el pago se confirma solo por el evento firmado.
  async consultar(transaccionId: string) {
    const { api, privada } = this.llaves;
    if (!privada) return null;
    const r = await fetch(`${api}/transactions/${encodeURIComponent(transaccionId)}`, {
      headers: { authorization: `Bearer ${privada}` },
    });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`Wompi respondió ${r.status} al consultar una transacción`);
    return aTransaccion(((await r.json()) as { data?: unknown }).data);
  }
}
