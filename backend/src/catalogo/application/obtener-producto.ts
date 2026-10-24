import { Inject, Injectable } from '@nestjs/common';
import { ProductoNoEncontrado, estaDisponible, stockTotal } from '../domain/producto.js';
import { REPOSITORIO_PRODUCTOS, type RepositorioProductos } from '../domain/repositorio-productos.js';

@Injectable()
export class ObtenerProducto {
  constructor(
    @Inject(REPOSITORIO_PRODUCTOS) private readonly repositorio: RepositorioProductos,
  ) {}

  async ejecutar(slug: string) {
    const producto = await this.repositorio.buscarPorSlug(slug);
    if (!producto || !producto.activo) throw new ProductoNoEncontrado(slug);
    return { ...producto, stockTotal: stockTotal(producto), disponible: estaDisponible(producto) };
  }
}
