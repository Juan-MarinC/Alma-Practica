import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import { POOL } from '../../../shared/database/database.module.js';
import {
  CorreoEnUso,
  type ClienteGuardado,
  type ClienteNuevo,
  type DatosDireccion,
  type Direccion,
  type PedidoCliente,
  type TipoEnlace,
} from '../../domain/cliente.js';
import type { RepositorioClientes } from '../../domain/repositorio-clientes.js';

const CLIENTE = `
  SELECT id, nombre, email, telefono, contrasena_hash AS "contrasenaHash", email_verificado AS "emailVerificado",
         contrasena_hash IS NOT NULL AS "tieneContrasena", google_sub IS NOT NULL AS "conGoogle", creado_en AS "creadaEn"
  FROM clientes`;

const DIRECCION = `id, departamento, ciudad, direccion, COALESCE(indicaciones, '') AS indicaciones`;

@Injectable()
export class RepositorioClientesPostgres implements RepositorioClientes {
  constructor(@Inject(POOL) private readonly pool: pg.Pool) {}

  private async uno(donde: string, valor: string) {
    const { rows } = await this.pool.query<ClienteGuardado>(`${CLIENTE} WHERE ${donde} = $1`, [valor]);
    return rows[0] ?? null;
  }

  async crear(c: ClienteNuevo) {
    try {
      const { rows } = await this.pool.query<{ id: string }>(
        `INSERT INTO clientes (nombre, email, telefono, contrasena_hash, google_sub, email_verificado, acepta_datos_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [c.nombre, c.email, c.telefono, c.contrasenaHash, c.googleSub, c.emailVerificado, c.aceptaDatosEn],
      );
      return rows[0].id;
    } catch (e) {
      if ((e as { code?: string }).code === '23505') throw new CorreoEnUso();
      throw e;
    }
  }

  porId(id: string) {
    return this.uno('id', id);
  }

  porEmail(email: string) {
    return this.uno('email', email);
  }

  porGoogle(sub: string) {
    return this.uno('google_sub', sub);
  }

  async vincularGoogle(id: string, sub: string) {
    await this.pool.query('UPDATE clientes SET google_sub = $2, email_verificado = true WHERE id = $1', [id, sub]);
  }

  async actualizarPerfil(id: string, { nombre, telefono }: { nombre: string; telefono: string | null }) {
    await this.pool.query('UPDATE clientes SET nombre = $2, telefono = $3 WHERE id = $1', [id, nombre, telefono]);
  }

  async cambiarContrasena(id: string, hash: string) {
    await this.pool.query('UPDATE clientes SET contrasena_hash = $2 WHERE id = $1', [id, hash]);
  }

  async marcarEmailVerificado(id: string) {
    await this.pool.query('UPDATE clientes SET email_verificado = true WHERE id = $1', [id]);
  }

  async reiniciarNoVerificada(id: string, nombre: string) {
    const c = await this.pool.connect();
    try {
      await c.query('BEGIN');
      await c.query('UPDATE clientes SET nombre = $2, telefono = NULL, contrasena_hash = NULL WHERE id = $1 AND NOT email_verificado', [id, nombre]);
      await c.query('DELETE FROM direcciones WHERE cliente_id = $1', [id]);
      await c.query('DELETE FROM sesiones_cliente WHERE cliente_id = $1', [id]);
      await c.query('UPDATE enlaces_cliente SET usado_en = now() WHERE cliente_id = $1 AND usado_en IS NULL', [id]);
      await c.query('COMMIT');
    } catch (e) {
      await c.query('ROLLBACK');
      throw e;
    } finally {
      c.release();
    }
  }

  async eliminar(id: string) {
    // Sesiones, enlaces y direcciones se borran en cascada; los pedidos quedan con cliente_id NULL.
    await this.pool.query('DELETE FROM clientes WHERE id = $1', [id]);
  }

  async crearSesion(tokenHash: string, clienteId: string, expira: Date) {
    await this.pool.query('DELETE FROM sesiones_cliente WHERE expira < now()');
    await this.pool.query('INSERT INTO sesiones_cliente (token_hash, cliente_id, expira) VALUES ($1, $2, $3)', [tokenHash, clienteId, expira]);
  }

  async clienteDeSesion(tokenHash: string) {
    const { rows } = await this.pool.query<{ cliente_id: string }>(
      'SELECT cliente_id FROM sesiones_cliente WHERE token_hash = $1 AND expira > now()',
      [tokenHash],
    );
    return rows[0]?.cliente_id ?? null;
  }

  async cerrarSesion(tokenHash: string) {
    await this.pool.query('DELETE FROM sesiones_cliente WHERE token_hash = $1', [tokenHash]);
  }

  async cerrarSesiones(clienteId: string, excepto?: string) {
    await this.pool.query('DELETE FROM sesiones_cliente WHERE cliente_id = $1 AND ($2::text IS NULL OR token_hash <> $2)', [
      clienteId,
      excepto ?? null,
    ]);
  }

  async guardarEnlace(tokenHash: string, clienteId: string, tipo: TipoEnlace, expira: Date) {
    // Un enlace nuevo anula los anteriores del mismo tipo: solo sirve el último correo.
    await this.pool.query('UPDATE enlaces_cliente SET usado_en = now() WHERE cliente_id = $1 AND tipo = $2 AND usado_en IS NULL', [clienteId, tipo]);
    await this.pool.query('INSERT INTO enlaces_cliente (token_hash, cliente_id, tipo, expira) VALUES ($1, $2, $3, $4)', [
      tokenHash,
      clienteId,
      tipo,
      expira,
    ]);
  }

  async usarEnlace(tokenHash: string, tipo: TipoEnlace) {
    // Un solo UPDATE: dos clics simultáneos en el mismo enlace no pueden usarlo dos veces.
    const { rows } = await this.pool.query<{ cliente_id: string }>(
      `UPDATE enlaces_cliente SET usado_en = now()
       WHERE token_hash = $1 AND tipo = $2 AND usado_en IS NULL AND expira > now()
       RETURNING cliente_id`,
      [tokenHash, tipo],
    );
    return rows[0]?.cliente_id ?? null;
  }

  async pedidos(clienteId: string, emailVerificado: string | null) {
    const { rows } = await this.pool.query<PedidoCliente>(
      `SELECT p.id, p.numero, p.estado, p.total, p.creado_en AS "creadoEn",
              (SELECT COALESCE(sum(i.cantidad), 0) FROM pedido_items i WHERE i.pedido_id = p.id)::int AS unidades
       FROM pedidos p
       WHERE p.cliente_id = $1
          OR ($2::text IS NOT NULL AND p.cliente_id IS NULL AND lower(p.contacto->>'email') = $2)
       ORDER BY p.creado_en DESC
       LIMIT 100`,
      [clienteId, emailVerificado],
    );
    return rows;
  }

  async direcciones(clienteId: string) {
    const { rows } = await this.pool.query<Direccion>(
      `SELECT ${DIRECCION} FROM direcciones WHERE cliente_id = $1 ORDER BY creada_en DESC, id DESC`,
      [clienteId],
    );
    return rows;
  }

  async agregarDireccion(clienteId: string, d: DatosDireccion) {
    const { rows } = await this.pool.query<Direccion>(
      `INSERT INTO direcciones (cliente_id, departamento, ciudad, direccion, indicaciones)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${DIRECCION}`,
      [clienteId, d.departamento, d.ciudad, d.direccion, d.indicaciones || null],
    );
    return rows[0];
  }

  async borrarDireccion(clienteId: string, id: number) {
    const r = await this.pool.query('DELETE FROM direcciones WHERE id = $2 AND cliente_id = $1', [clienteId, id]);
    return (r.rowCount ?? 0) > 0;
  }
}
