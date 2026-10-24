import { Inject, Injectable } from '@nestjs/common';
import { stockTotal } from '../domain/producto.js';
import { REPOSITORIO_PRODUCTOS, type RepositorioProductos } from '../domain/repositorio-productos.js';

// A diferencia de ListarProductos, incluye los productos inactivos.
@Injectable()
export class ListarProductosAdmin {
  constructor(
    @Inject(REPOSITORIO_PRODUCTOS) private readonly repositorio: RepositorioProductos,
  ) {}

  async ejecutar() {
    const productos = await this.repositorio.listar({});
    return productos.map((p) => ({ ...p, stockTotal: stockTotal(p) }));
  }
}
