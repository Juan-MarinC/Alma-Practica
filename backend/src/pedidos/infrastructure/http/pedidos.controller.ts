import {
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  ServiceUnavailableException,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ResolverSesion } from '../../../clientes/application/acceso.js';
import { tokenBearer } from '../../../clientes/infrastructure/http/cliente.guard.js';
import { IniciarPago } from '../../../pagos/application/pagos.js';
import { PasarelaNoConfigurada } from '../../../pagos/domain/pago.js';
import { AdminGuard } from '../../../shared/auth/admin.guard.js';
import {
  CambiarEstadoPedido,
  ConsultarPedido,
  ListarPedidosAdmin,
  ObtenerPedidoAdmin,
} from '../../application/consultar-pedidos.js';
import { CrearPedido } from '../../application/crear-pedido.js';
import { DatosInvalidos, PedidoNoEncontrado, TransicionInvalida } from '../../domain/pedido.js';

function aHttp(e: unknown): never {
  if (e instanceof DatosInvalidos) throw new UnprocessableEntityException({ errores: e.errores });
  if (e instanceof PedidoNoEncontrado) throw new NotFoundException({ errores: ['No encontramos ese pedido'] });
  if (e instanceof TransicionInvalida) throw new ConflictException({ errores: [e.message] });
  if (e instanceof PasarelaNoConfigurada)
    throw new ServiceUnavailableException({ errores: ['Los pagos todavía no están habilitados. Intenta más tarde.'] });
  throw e;
}

const urlRetorno = (id: string) => `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/pedido/${id}`;

@Controller('pedidos')
export class PedidosController {
  constructor(
    private readonly crearPedido: CrearPedido,
    private readonly consultarPedido: ConsultarPedido,
    private readonly iniciarPago: IniciarPago,
    private readonly resolverSesion: ResolverSesion,
  ) {}

  // Con sesión de clienta el pedido queda en su cuenta; sin sesión (o vencida) es compra como invitada.
  @Post()
  @HttpCode(201)
  async crear(@Body() datos: unknown, @Headers('authorization') cabecera?: string) {
    try {
      if (!this.iniciarPago.disponible()) throw new PasarelaNoConfigurada();
      const clienteId = await this.resolverSesion.ejecutar(tokenBearer(cabecera));
      const pedido = await this.crearPedido.ejecutar(datos, clienteId);
      return { id: pedido.id, numero: pedido.numero, urlPago: await this.iniciarPago.ejecutar(pedido, urlRetorno(pedido.id)) };
    } catch (e) {
      aHttp(e);
    }
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultarPedido.ejecutar(id).catch(aHttp);
  }

  // Reintentar el pago de un pedido que sigue pendiente (por ejemplo, tras un rechazo).
  @Post(':id/pago')
  @HttpCode(201)
  async reintentar(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const pedido = await this.consultarPedido.ejecutar(id);
      if (pedido.estado !== 'pendiente_pago') throw new TransicionInvalida('Este pedido ya no está pendiente de pago');
      return { urlPago: await this.iniciarPago.ejecutar(pedido, urlRetorno(id)) };
    } catch (e) {
      aHttp(e);
    }
  }
}

@Controller('admin/pedidos')
@UseGuards(AdminGuard)
export class AdminPedidosController {
  constructor(
    private readonly listar: ListarPedidosAdmin,
    private readonly obtenerPedido: ObtenerPedidoAdmin,
    private readonly cambiarEstado: CambiarEstadoPedido,
  ) {}

  @Get()
  lista() {
    return this.listar.ejecutar();
  }

  @Get(':id')
  detalle(@Param('id', ParseUUIDPipe) id: string) {
    return this.obtenerPedido.ejecutar(id).catch(aHttp);
  }

  @Patch(':id')
  async actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() datos: { estado?: unknown; guiaEnvio?: unknown }) {
    await this.cambiarEstado.ejecutar(id, datos ?? {}).catch(aHttp);
    return this.obtenerPedido.ejecutar(id);
  }
}
