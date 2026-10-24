import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ListarProductos } from '../../application/listar-productos.js';
import { ObtenerProducto } from '../../application/obtener-producto.js';
import { ProductoNoEncontrado } from '../../domain/producto.js';

// Adaptador de entrada: traduce HTTP a casos de uso.
@Controller('productos')
export class ProductosController {
  constructor(
    private readonly listarProductos: ListarProductos,
    private readonly obtenerProducto: ObtenerProducto,
  ) {}

  @Get()
  listar(@Query('categoria') categoria?: string, @Query('q') busqueda?: string) {
    return this.listarProductos.ejecutar({ categoria, busqueda });
  }

  @Get(':slug')
  async obtener(@Param('slug') slug: string) {
    try {
      return await this.obtenerProducto.ejecutar(slug);
    } catch (e) {
      if (e instanceof ProductoNoEncontrado) throw new NotFoundException(e.message);
      throw e;
    }
  }
}
