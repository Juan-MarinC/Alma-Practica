import { Module } from '@nestjs/common';
import { CatalogoModule } from './catalogo/catalogo.module.js';
import { ClientesModule } from './clientes/clientes.module.js';
import { PedidosModule } from './pedidos/pedidos.module.js';
import { DatabaseModule } from './shared/database/database.module.js';

@Module({
  imports: [DatabaseModule, CatalogoModule, ClientesModule, PedidosModule],
})
export class AppModule {}
