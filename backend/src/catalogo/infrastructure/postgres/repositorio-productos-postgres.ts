import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import { POOL } from '../../../shared/database/database.module.js';
import {
  ConflictoProducto,
  DatosInvalidos,
  ProductoNoEncontrado,
  type Producto,
  type ProductoEntrada,
} from '../../domain/producto.js';
import type { FiltroProductos, RepositorioProductos } from '../../domain/repositorio-productos.js';

const CONSULTA_BASE = `
  SELECT p.id, p.slug, p.nombre, p.descripcion, c.slug AS categoria,
         p.precio_base, p.precio_antes, p.nuevo, p.activo, p.atributos,
         COALESCE(
           json_agg(json_build_object('sku', v.sku, 'opciones', v.opciones,
                    'precio', COALESCE(v.precio, p.precio_base), 'stock', v.stock)
                    ORDER BY v.id) FILTER (WHERE v.id IS NOT NULL),
           '[]'
         ) AS variantes,
         (SELECT COALESCE(json_agg(i.url ORDER BY i.orden, i.id), '[]')
            FROM imagenes i WHERE i.producto_id = p.id) AS imagenes
  FROM productos p
  JOIN categorias c ON c.id = p.categoria_id
  LEFT JOIN variantes v ON v.producto_id = p.id
`;

type Fila = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio_base: number;
  precio_antes: number | null;
  nuevo: boolean;
  activo: boolean;
  atributos: Record<string, unknown>;
  imagenes: string[];
  variantes: Producto['variantes'];
};

function aDominio(f: Fila): Producto {
  return {
    id: f.id,
    slug: f.slug,
    nombre: f.nombre,
    descripcion: f.descripcion,
    categoria: f.categoria,
    precio: Number(f.precio_base),
    precioAntes: f.precio_antes === null ? null : Number(f.precio_antes),
    nuevo: f.nuevo,
    activo: f.activo,
    atributos: f.atributos,
    imagenes: f.imagenes,
    variantes: f.variantes.map((v) => ({ ...v, precio: Number(v.precio) })),
  };
}

@Injectable()
export class RepositorioProductosPostgres implements RepositorioProductos {
  constructor(@Inject(POOL) private readonly pool: pg.Pool) {}

  async listar({ categoria, busqueda }: FiltroProductos) {
    const { rows } = await this.pool.query<Fila>(
      `${CONSULTA_BASE}
       WHERE ($1::text IS NULL OR c.slug = $1)
         AND ($2::text IS NULL OR p.nombre ILIKE '%' || $2 || '%')
       GROUP BY p.id, c.slug
       ORDER BY p.creado_en DESC`,
      [categoria ?? null, busqueda ?? null],
    );
    return rows.map(aDominio);
  }

  async buscarPorSlug(slug: string) {
    const { rows } = await this.pool.query<Fila>(
      `${CONSULTA_BASE} WHERE p.slug = $1 GROUP BY p.id, c.slug`,
      [slug],
    );
    return rows[0] ? aDominio(rows[0]) : null;
  }

  async guardar(e: ProductoEntrada, slugActual?: string) {
    const cliente = await this.pool.connect();
    try {
      await cliente.query('BEGIN');
      const cat = await cliente.query<{ id: number }>('SELECT id FROM categorias WHERE slug = $1', [e.categoria]);
      if (!cat.rows[0]) throw new DatosInvalidos([`Categoría: no existe "${e.categoria}"`]);

      const valores = [e.slug, e.nombre, e.descripcion, cat.rows[0].id, e.precio, e.precioAntes, e.nuevo, e.activo, e.atributos];
      const { rows } =
        slugActual === undefined
          ? await cliente.query<{ id: string }>(
              `INSERT INTO productos (slug, nombre, descripcion, categoria_id, precio_base, precio_antes, nuevo, activo, atributos)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
              valores,
            )
          : await cliente.query<{ id: string }>(
              `UPDATE productos SET slug = $1, nombre = $2, descripcion = $3, categoria_id = $4, precio_base = $5,
                      precio_antes = $6, nuevo = $7, activo = $8, atributos = $9
               WHERE slug = $10 RETURNING id`,
              [...valores, slugActual],
            );
      const id = rows[0]?.id;
      if (!id) throw new ProductoNoEncontrado(slugActual ?? e.slug);

      // Variantes: se actualizan por SKU para conservar su id (pedido_items las referencia).
      await cliente.query('DELETE FROM variantes WHERE producto_id = $1 AND NOT (sku = ANY($2))', [
        id,
        e.variantes.map((v) => v.sku),
      ]);
      for (const v of e.variantes) {
        const r = await cliente.query(
          `INSERT INTO variantes (producto_id, sku, opciones, precio, stock) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (sku) DO UPDATE SET opciones = EXCLUDED.opciones, precio = EXCLUDED.precio, stock = EXCLUDED.stock
           WHERE variantes.producto_id = EXCLUDED.producto_id AND ($6::int IS NULL OR variantes.stock = $6)`,
          [id, v.sku, v.opciones, v.precio, v.stock, v.stockAnterior],
        );
        if (r.rowCount === 0) {
          const { rows: dueño } = await cliente.query<{ producto_id: string }>('SELECT producto_id FROM variantes WHERE sku = $1', [v.sku]);
          throw new ConflictoProducto(
            dueño[0]?.producto_id === id
              ? `El stock de "${v.sku}" cambió mientras editabas (probablemente una venta). Recarga la página y vuelve a intentarlo.`
              : `El SKU "${v.sku}" ya pertenece a otro producto`,
          );
        }
      }

      await cliente.query('DELETE FROM imagenes WHERE producto_id = $1', [id]);
      for (const [orden, url] of e.imagenes.entries()) {
        await cliente.query('INSERT INTO imagenes (producto_id, url, orden) VALUES ($1, $2, $3)', [id, url, orden]);
      }
      await cliente.query('COMMIT');
    } catch (err) {
      await cliente.query('ROLLBACK');
      const codigo = (err as { code?: string }).code;
      if (codigo === '23505') throw new ConflictoProducto(`Ya existe un producto con el slug "${e.slug}"`);
      if (codigo === '23503')
        throw new ConflictoProducto('No se puede quitar una variante que ya tiene pedidos: deja su stock en 0');
      throw err;
    } finally {
      cliente.release();
    }
    return (await this.buscarPorSlug(e.slug))!;
  }
}
