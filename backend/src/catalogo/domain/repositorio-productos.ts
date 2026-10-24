import type { Producto, ProductoEntrada } from './producto.js';

// Puerto de salida: el dominio dice QUÉ necesita; la infraestructura decide CÓMO.
export const REPOSITORIO_PRODUCTOS = Symbol('RepositorioProductos');

export type FiltroProductos = {
  categoria?: string;
  busqueda?: string;
};

export interface RepositorioProductos {
  listar(filtro: FiltroProductos): Promise<Producto[]>;
  buscarPorSlug(slug: string): Promise<Producto | null>;
  /**
   * Crea (sin `slugActual`) o reemplaza un producto con sus variantes e imágenes.
   * Lanza ProductoNoEncontrado, DatosInvalidos (categoría inexistente) o ConflictoProducto.
   */
  guardar(producto: ProductoEntrada, slugActual?: string): Promise<Producto>;
}
