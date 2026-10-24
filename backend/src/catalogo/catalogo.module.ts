import { Module } from '@nestjs/common';
import { GuardarProducto } from './application/guardar-producto.js';
import { ListarProductos } from './application/listar-productos.js';
import { ListarProductosAdmin } from './application/listar-productos-admin.js';
import { ObtenerProducto } from './application/obtener-producto.js';
import { REPOSITORIO_PRODUCTOS } from './domain/repositorio-productos.js';
import { AdminProductosController } from './infrastructure/http/admin-productos.controller.js';
import { ProductosController } from './infrastructure/http/productos.controller.js';
import { RepositorioProductosPostgres } from './infrastructure/postgres/repositorio-productos-postgres.js';

@Module({
  controllers: [ProductosController, AdminProductosController],
  providers: [
    ListarProductos,
    ObtenerProducto,
    ListarProductosAdmin,
    GuardarProducto,
    { provide: REPOSITORIO_PRODUCTOS, useClass: RepositorioProductosPostgres },
  ],
})
export class CatalogoModule {}
