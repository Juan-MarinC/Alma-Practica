import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import { POOL } from '../../../shared/database/database.module.js';
import { ESTADOS_FINALES, montoCoincide, type RepositorioPagos, type ResultadoPago, type Transaccion } from '../../domain/pago.js';

type FilaPago = {
  pago_estado: string;
  pedido_id: string;
  numero: number;
  pedido_estado: string;
  total: number;
  contacto: { nombre: string; email: string };
};

@Injectable()
export class RepositorioPagosPostgres implements RepositorioPagos {
  constructor(@Inject(POOL) private readonly pool: pg.Pool) {}

  async registrar(pedidoId: string, referencia: string) {
    await this.pool.query('INSERT INTO pagos (pedido_id, referencia) VALUES ($1, $2)', [pedidoId, referencia]);
  }

  async aplicar(t: Transaccion): Promise<ResultadoPago> {
    const c = await this.pool.connect();
    try {
      await c.query('BEGIN');
      // Bloquea el pago y su pedido: dos avisos simultáneos de la misma transacción se procesan uno tras otro.
      const { rows } = await c.query<FilaPago>(
        `SELECT pg.estado AS pago_estado, p.id AS pedido_id, p.numero, p.estado AS pedido_estado, p.total, p.contacto
         FROM pagos pg JOIN pedidos p ON p.id = pg.pedido_id
         WHERE pg.referencia = $1
         FOR UPDATE`,
        [t.referencia],
      );
      const f = rows[0];
      const resultado = !f ? ({ tipo: 'desconocido' } as const) : await this.decidir(c, f, t);
      await c.query('COMMIT');
      return resultado;
    } catch (e) {
      await c.query('ROLLBACK');
      throw e;
    } finally {
      c.release();
    }
  }

  private async decidir(c: pg.PoolClient, f: FilaPago, t: Transaccion): Promise<ResultadoPago> {
    const numero = f.numero;
    // Solo un pago aprobado es definitivo; tras un rechazo la clienta puede reintentar con la misma referencia.
    if (f.pago_estado === 'APPROVED') return { tipo: 'repetido', numero };

    // Se guarda lo mínimo de la respuesta: sin correo ni datos de la clienta.
    const guardarPago = (estado: string) =>
      c.query('UPDATE pagos SET estado = $2, metodo = $3, respuesta = $4 WHERE referencia = $1', [
        t.referencia,
        estado,
        t.metodo,
        { transaccionId: t.id, estado: t.estado, metodo: t.metodo, montoCentavos: t.montoCentavos },
      ]);

    if (!montoCoincide(f.total, t)) {
      await guardarPago('MONTO_INVALIDO');
      return { tipo: 'monto_invalido', numero };
    }
    if (!ESTADOS_FINALES.has(t.estado)) {
      await guardarPago(t.estado);
      return { tipo: 'pendiente', numero };
    }
    await guardarPago(t.estado);

    // Rechazado: el pedido sigue en pendiente_pago para poder reintentar; el panel puede cancelarlo.
    if (t.estado !== 'APPROVED') return { tipo: 'rechazado', numero };
    if (f.pedido_estado !== 'pendiente_pago') return { tipo: 'reembolsar', numero };

    // Bloquea las variantes en orden fijo (evita interbloqueos) y verifica stock antes de descontar.
    const { rows: lineas } = await c.query<{ nombre: string; opciones: Record<string, string>; cantidad: number; precio_unitario: number; stock: number }>(
      `SELECT pr.nombre, v.opciones, i.cantidad, i.precio_unitario, v.stock
       FROM pedido_items i
       JOIN variantes v ON v.id = i.variante_id
       JOIN productos pr ON pr.id = v.producto_id
       WHERE i.pedido_id = $1
       ORDER BY v.id
       FOR UPDATE OF v`,
      [f.pedido_id],
    );
    if (lineas.some((l) => l.stock < l.cantidad)) {
      await c.query(`UPDATE pedidos SET estado = 'cancelado' WHERE id = $1`, [f.pedido_id]);
      return { tipo: 'reembolsar', numero };
    }
    await c.query(
      `UPDATE variantes v SET stock = v.stock - i.cantidad FROM pedido_items i WHERE i.pedido_id = $1 AND v.id = i.variante_id`,
      [f.pedido_id],
    );
    await c.query(`UPDATE pedidos SET estado = 'pagado' WHERE id = $1`, [f.pedido_id]);
    return {
      tipo: 'aprobado',
      confirmacion: {
        numero,
        nombre: f.contacto.nombre,
        email: f.contacto.email,
        total: f.total,
        lineas: lineas.map((l) => ({
          nombre: l.nombre,
          detalle: Object.values(l.opciones).join(' · '),
          cantidad: l.cantidad,
          precioUnitario: l.precio_unitario,
        })),
      },
    };
  }
}
