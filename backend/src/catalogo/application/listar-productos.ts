import { Inject, Injectable } from '@nestjs/common';
import { estaDisponible, stockTotal } from '../domain/producto.js';
import {
  REPOSITORIO_PRODUCTOS,
  type FiltroProductos,
  type RepositorioProductos,
} from '../domain/repositorio-productos.js';

@Injectable()
export class ListarProductos {
  constructor(
    @Inject(REPOSITORIO_PRODUCTOS) private readonly repositorio: RepositorioProductos,
  ) {}

  async ejecutar(filtro: FiltroProductos) {
    const productos = await this.repositorio.listar(filtro);
    return productos
      .filter((p) => p.activo)
      .map((p) => ({ ...p, stockTotal: stockTotal(p), disponible: estaDisponible(p) }));
  }
}
