import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import { POOL } from '../../../shared/database/database.module.js';
import { devuelveStock, PedidoNoEncontrado, type EstadoPedido, type PedidoNuevo } from '../../domain/pedido.js';
import type {
  FilaPedidoAdmin,
  PedidoAdmin,
  RepositorioPedidos,
  ResumenPedido,
} from '../../domain/repositorio-pedidos.js';

const RESUMEN = `
  SELECT p.id, p.numero, p.estado, p.subtotal, p.costo_envio AS "costoEnvio", p.total,
         p.guia_envio AS "guiaEnvio", p.creado_en AS "creadoEn", p.contacto, p.envio,
         json_agg(json_build_object('nombre', pr.nombre, 'opciones', v.opciones,
                  'cantidad', i.cantidad, 'precioUnitario', i.precio_unitario) ORDER BY pr.nombre) AS lineas,
         (SELECT json_build_object('referencia', pg.referencia, 'estado', pg.estado, 'metodo', pg.metodo)
            FROM pagos pg WHERE pg.pedido_id = p.id ORDER BY pg.creado_en DESC LIMIT 1) AS pago
  FROM pedidos p
  JOIN pedido_items i ON i.pedido_id = p.id
  JOIN variantes v ON v.id = i.variante_id
  JOIN productos pr ON pr.id = v.producto_id
  WHERE p.id = $1
  GROUP BY p.id
`;

@Injectable()
export class RepositorioPedidosPostgres implements RepositorioPedidos {
  constructor(@Inject(POOL) private readonly pool: pg.Pool) {}

  async variantesVendibles(skus: string[]) {
    const { rows } = await this.pool.query(
      `SELECT v.id AS "varianteId", v.sku, p.nombre, p.activo, COALESCE(v.precio, p.precio_base) AS precio, v.stock
       FROM variantes v JOIN productos p ON p.id = v.producto_id
       WHERE v.sku = ANY($1)`,
      [skus],
    );
    return rows;
  }

  async crear(pedido: PedidoNuevo) {
    const cliente = await this.pool.connect();
    try {
      await cliente.query('BEGIN');
      const { rows } = await cliente.query<{ id: string; numero: number }>(
        `INSERT INTO pedidos (contacto, envio, subtotal, costo_envio, total) VALUES ($1, $2, $3, $4, $5) RETURNING id, numero`,
        [pedido.contacto, pedido.envio, pedido.subtotal, pedido.costoEnvio, pedido.total],
      );
      await cliente.query(
        `INSERT INTO pedido_items (pedido_id, variante_id, cantidad, precio_unitario)
         SELECT $1, * FROM unnest($2::int[], $3::int[], $4::int[])`,
        [
          rows[0].id,
          pedido.lineas.map((l) => l.varianteId),
          pedido.lineas.map((l) => l.cantidad),
          pedido.lineas.map((l) => l.precioUnitario),
        ],
      );
      await cliente.query('COMMIT');
      return rows[0];
    } catch (e) {
      await cliente.query('ROLLBACK');
      throw e;
    } finally {
      cliente.release();
    }
  }

  async resumen(id: string): Promise<ResumenPedido | null> {
    const fila = await this.detalleAdmin(id);
    if (!fila) return null;
    const { contacto: _c, envio: _e, pago, ...publico } = fila;
    return { ...publico, pagoEstado: pago?.estado ?? null };
  }

  async detalleAdmin(id: string): Promise<PedidoAdmin | null> {
    const { rows } = await this.pool.query<PedidoAdmin>(RESUMEN, [id]);
    return rows[0] ?? null;
  }

  async listarAdmin() {
    const { rows } = await this.pool.query<FilaPedidoAdmin>(
      `SELECT p.id, p.numero, p.estado, p.total, p.creado_en AS "creadoEn",
              p.contacto->>'nombre' AS cliente, p.envio->>'ciudad' AS ciudad,
              (SELECT pg.estado FROM pagos pg WHERE pg.pedido_id = p.id ORDER BY pg.creado_en DESC LIMIT 1) AS "pagoEstado"
       FROM pedidos p
       ORDER BY p.creado_en DESC
       LIMIT 300`,
    );
    return rows;
  }

  async cambiarEstado(id: string, decidir: (actual: EstadoPedido) => { estado: EstadoPedido; guia: string | null }) {
    const cliente = await this.pool.connect();
    try {
      await cliente.query('BEGIN');
      const { rows } = await cliente.query<{ estado: EstadoPedido }>('SELECT estado FROM pedidos WHERE id = $1 FOR UPDATE', [id]);
      if (!rows[0]) throw new PedidoNoEncontrado(`No existe el pedido ${id}`);
      const actual = rows[0].estado;
      const { estado, guia } = decidir(actual);
      await cliente.query('UPDATE pedidos SET estado = $2, guia_envio = COALESCE($3, guia_envio) WHERE id = $1', [id, estado, guia]);
      if (estado === 'cancelado' && devuelveStock(actual)) {
        await cliente.query(
          `UPDATE variantes v SET stock = v.stock + i.cantidad FROM pedido_items i WHERE i.pedido_id = $1 AND v.id = i.variante_id`,
          [id],
        );
      }
      await cliente.query('COMMIT');
    } catch (e) {
      await cliente.query('ROLLBACK');
      throw e;
    } finally {
      cliente.release();
    }
  }
}
