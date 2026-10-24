import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../../shared/auth/admin.guard.js';
import { GuardarProducto } from '../../application/guardar-producto.js';
import { ListarProductosAdmin } from '../../application/listar-productos-admin.js';
import { ConflictoProducto, DatosInvalidos, ProductoNoEncontrado } from '../../domain/producto.js';

function aHttp(e: unknown): never {
  if (e instanceof DatosInvalidos) throw new UnprocessableEntityException({ errores: e.errores });
  if (e instanceof ConflictoProducto) throw new ConflictException({ errores: [e.message] });
  if (e instanceof ProductoNoEncontrado) throw new NotFoundException({ errores: [e.message] });
  throw e;
}

@Controller('admin/productos')
@UseGuards(AdminGuard)
export class AdminProductosController {
  constructor(
    private readonly listarProductos: ListarProductosAdmin,
    private readonly guardarProducto: GuardarProducto,
  ) {}

  @Get()
  listar() {
    return this.listarProductos.ejecutar();
  }

  @Post()
  @HttpCode(201)
  crear(@Body() datos: unknown) {
    return this.guardarProducto.ejecutar(datos).catch(aHttp);
  }

  @Put(':slug')
  actualizar(@Param('slug') slug: string, @Body() datos: unknown) {
    return this.guardarProducto.ejecutar(datos, slug).catch(aHttp);
  }
}
