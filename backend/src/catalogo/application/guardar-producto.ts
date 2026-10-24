import { Inject, Injectable } from '@nestjs/common';
import { validarProducto } from '../domain/producto.js';
import { REPOSITORIO_PRODUCTOS, type RepositorioProductos } from '../domain/repositorio-productos.js';

@Injectable()
export class GuardarProducto {
  constructor(
    @Inject(REPOSITORIO_PRODUCTOS) private readonly repositorio: RepositorioProductos,
  ) {}

  /** Sin `slugActual` crea; con él, edita ese producto (el slug puede cambiar). */
  async ejecutar(datos: unknown, slugActual?: string) {
    return this.repositorio.guardar(validarProducto(datos), slugActual);
  }
}
