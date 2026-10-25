import { Module } from '@nestjs/common';
import { ClientesModule } from '../clientes/clientes.module.js';
import { PagosModule } from '../pagos/pagos.module.js';
import {
  CambiarEstadoPedido,
  ConsultarPedido,
  ListarPedidosAdmin,
  ObtenerPedidoAdmin,
} from './application/consultar-pedidos.js';
import { CrearPedido } from './application/crear-pedido.js';
import { REPOSITORIO_PEDIDOS } from './domain/repositorio-pedidos.js';
import { AdminPedidosController, PedidosController } from './infrastructure/http/pedidos.controller.js';
import { RepositorioPedidosPostgres } from './infrastructure/postgres/repositorio-pedidos-postgres.js';

@Module({
  imports: [PagosModule, ClientesModule],
  controllers: [PedidosController, AdminPedidosController],
  providers: [
    CrearPedido,
    ConsultarPedido,
    ListarPedidosAdmin,
    ObtenerPedidoAdmin,
    CambiarEstadoPedido,
    { provide: REPOSITORIO_PEDIDOS, useClass: RepositorioPedidosPostgres },
  ],
})
export class PedidosModule {}
