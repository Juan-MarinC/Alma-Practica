// Dominio puro de pagos: no sabe nada de Wompi ni de Postgres.

/** Transacción tal como la reporta la pasarela (ya verificada). */
export type Transaccion = {
  id: string;
  referencia: string;
  estado: string; // APPROVED, DECLINED, VOIDED, ERROR, PENDING
  montoCentavos: number;
  moneda: string;
  metodo: string | null;
};

export type Confirmacion = {
  numero: number;
  nombre: string;
  email: string;
  total: number;
  lineas: { nombre: string; detalle: string; cantidad: number; precioUnitario: number }[];
};

export type ResultadoPago =
  | { tipo: 'aprobado'; confirmacion: Confirmacion }
  | { tipo: 'reembolsar'; numero: number } // pagó, pero ya no hay stock o el pedido estaba cancelado
  | { tipo: 'rechazado' | 'pendiente' | 'repetido' | 'monto_invalido'; numero: number }
  | { tipo: 'desconocido' };

export const ESTADOS_FINALES = new Set(['APPROVED', 'DECLINED', 'VOIDED', 'ERROR']);

/** El monto pagado debe ser exactamente el total del pedido, en pesos colombianos. */
export const montoCoincide = (totalPesos: number, t: Transaccion) => t.moneda === 'COP' && t.montoCentavos === totalPesos * 100;

export class FirmaInvalida extends Error {}
export class PasarelaNoConfigurada extends Error {}

export const PASARELA_PAGOS = Symbol('PasarelaPagos');
export const REPOSITORIO_PAGOS = Symbol('RepositorioPagos');

// Puerto de la pasarela: hoy Wompi (pagos/infrastructure/wompi), mañana otra.
export interface PasarelaPagos {
  configurada(): boolean;
  /** URL a la que se envía a la clienta para pagar. */
  urlCheckout(pago: { referencia: string; montoCentavos: number; urlRetorno: string }): string;
  /** Verifica la firma del evento. Lanza FirmaInvalida; devuelve null si el evento no es de una transacción. */
  leerEvento(cuerpo: unknown): Transaccion | null;
  /** Consulta la transacción directamente a la pasarela (fuente confiable, no el navegador). */
  consultar(transaccionId: string): Promise<Transaccion | null>;
}

export interface RepositorioPagos {
  registrar(pedidoId: string, referencia: string): Promise<void>;
  /** Aplica la transacción en una sola transacción de base de datos: pago, estado del pedido y stock. Idempotente. */
  aplicar(t: Transaccion): Promise<ResultadoPago>;
}
