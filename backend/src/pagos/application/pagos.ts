import { randomBytes } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CORREO, escaparHtml, type Correo } from '../../shared/correo/correo.js';
import {
  PASARELA_PAGOS,
  PasarelaNoConfigurada,
  REPOSITORIO_PAGOS,
  type Confirmacion,
  type PasarelaPagos,
  type RepositorioPagos,
  type Transaccion,
} from '../domain/pago.js';

@Injectable()
export class IniciarPago {
  constructor(
    @Inject(PASARELA_PAGOS) private readonly pasarela: PasarelaPagos,
    @Inject(REPOSITORIO_PAGOS) private readonly repositorio: RepositorioPagos,
  ) {}

  disponible() {
    return this.pasarela.configurada();
  }

  /** Registra un intento de pago con referencia nueva y devuelve la URL para pagar. */
  async ejecutar(pedido: { id: string; numero: number; total: number }, urlRetorno: string) {
    if (!this.pasarela.configurada()) throw new PasarelaNoConfigurada();
    const referencia = `ALMA-${pedido.numero}-${randomBytes(4).toString('hex')}`;
    await this.repositorio.registrar(pedido.id, referencia);
    return this.pasarela.urlCheckout({ referencia, montoCentavos: pedido.total * 100, urlRetorno });
  }
}

const pesos = (n: number) => `$${n.toLocaleString('es-CO')}`;

function correoConfirmacion(c: Confirmacion) {
  const filas = c.lineas
    .map(
      (l) =>
        `<tr><td style="padding:6px 0">${escaparHtml(l.nombre)}${l.detalle ? ` <small>(${escaparHtml(l.detalle)})</small>` : ''} × ${l.cantidad}</td>` +
        `<td style="text-align:right">${pesos(l.precioUnitario * l.cantidad)}</td></tr>`,
    )
    .join('');
  return (
    `<div style="font-family:sans-serif;color:#3d2b2b;max-width:520px">` +
    `<h2>¡Gracias por tu compra, ${escaparHtml(c.nombre.split(' ')[0])}!</h2>` +
    `<p>Recibimos el pago de tu pedido <strong>#${c.numero}</strong>. Te avisaremos cuando salga para tu dirección.</p>` +
    `<table style="width:100%;border-collapse:collapse">${filas}` +
    `<tr><td style="padding-top:12px"><strong>Total</strong></td><td style="text-align:right;padding-top:12px"><strong>${pesos(c.total)}</strong></td></tr></table>` +
    `</div>`
  );
}

@Injectable()
export class ProcesarTransaccion {
  private readonly log = new Logger('Pagos');

  constructor(
    @Inject(PASARELA_PAGOS) private readonly pasarela: PasarelaPagos,
    @Inject(REPOSITORIO_PAGOS) private readonly repositorio: RepositorioPagos,
    @Inject(CORREO) private readonly correo: Correo,
  ) {}

  /** Aplica una transacción verificada (por webhook o por consulta directa a la pasarela). */
  async ejecutar(t: Transaccion) {
    const r = await this.repositorio.aplicar(t);
    const numero = 'numero' in r ? r.numero : r.tipo === 'aprobado' ? r.confirmacion.numero : '?';
    this.log.log(`Transacción ${t.referencia}: ${t.estado} -> ${r.tipo} (pedido #${numero})`);
    const tienda = process.env.CORREO_TIENDA;

    // Los correos no deben tumbar el procesamiento del pago (ya quedó guardado).
    try {
      if (r.tipo === 'aprobado') {
        await this.correo.enviar({ para: r.confirmacion.email, asunto: `Tu pedido #${numero} está confirmado`, html: correoConfirmacion(r.confirmacion) });
        if (tienda) await this.correo.enviar({ para: tienda, asunto: `Nuevo pedido pagado #${numero}`, html: `<p>Revisa el pedido #${numero} en el panel.</p>` });
      }
      if ((r.tipo === 'reembolsar' || r.tipo === 'monto_invalido') && tienda) {
        await this.correo.enviar({
          para: tienda,
          asunto: `Revisar pago del pedido #${numero}`,
          html: `<p>El pago del pedido #${numero} necesita revisión (${r.tipo === 'reembolsar' ? 'pagado sin stock o pedido cancelado: reembolsar' : 'el monto no coincide'}).</p>`,
        });
      }
    } catch (e) {
      this.log.error(`No se pudo enviar el correo del pedido #${numero}: ${(e as Error).message}`);
    }
    if (r.tipo === 'reembolsar' || r.tipo === 'monto_invalido') this.log.warn(`Pedido #${numero} requiere revisión manual: ${r.tipo}`);
    return r.tipo;
  }

  /** Para cuando la clienta vuelve de Wompi: se consulta a Wompi, no se confía en lo que diga el navegador. */
  async verificar(transaccionId: string) {
    const t = await this.pasarela.consultar(transaccionId);
    return t ? this.ejecutar(t) : 'desconocido';
  }
}
