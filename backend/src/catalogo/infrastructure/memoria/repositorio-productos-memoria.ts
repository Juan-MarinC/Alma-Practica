import {
  ConflictoProducto,
  ProductoNoEncontrado,
  type Producto,
  type ProductoEntrada,
} from '../../domain/producto.js';
import type { FiltroProductos, RepositorioProductos } from '../../domain/repositorio-productos.js';

// Adaptador en memoria: útil para pruebas sin base de datos.
export class RepositorioProductosMemoria implements RepositorioProductos {
  constructor(private readonly productos: Producto[] = []) {}

  async listar({ categoria, busqueda }: FiltroProductos) {
    const q = busqueda?.toLowerCase();
    return this.productos.filter(
      (p) => (!categoria || p.categoria === categoria) && (!q || p.nombre.toLowerCase().includes(q)),
    );
  }

  async buscarPorSlug(slug: string) {
    return this.productos.find((p) => p.slug === slug) ?? null;
  }

  async guardar(entrada: ProductoEntrada, slugActual?: string) {
    const indice = slugActual === undefined ? -1 : this.productos.findIndex((p) => p.slug === slugActual);
    if (slugActual !== undefined && indice < 0) throw new ProductoNoEncontrado(slugActual);
    if (this.productos.some((p, i) => p.slug === entrada.slug && i !== indice))
      throw new ConflictoProducto(`Ya existe un producto con el slug "${entrada.slug}"`);
    for (const v of entrada.variantes) {
      const actual = this.productos[indice]?.variantes.find((x) => x.sku === v.sku);
      if (actual && v.stockAnterior !== null && actual.stock !== v.stockAnterior)
        throw new ConflictoProducto(`El stock de "${v.sku}" cambió mientras editabas`);
    }
    const producto: Producto = {
      ...entrada,
      id: this.productos[indice]?.id ?? String(this.productos.length + 1),
      variantes: entrada.variantes.map((v) => ({ sku: v.sku, opciones: v.opciones, stock: v.stock, precio: v.precio ?? entrada.precio })),
    };
    if (indice < 0) this.productos.push(producto);
    else this.productos[indice] = producto;
    return producto;
  }
}
