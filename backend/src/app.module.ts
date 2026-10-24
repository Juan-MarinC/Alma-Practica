import { Module } from '@nestjs/common';
import { CatalogoModule } from './catalogo/catalogo.module.js';
import { PedidosModule } from './pedidos/pedidos.module.js';
import { DatabaseModule } from './shared/database/database.module.js';

@Module({
  imports: [DatabaseModule, CatalogoModule, PedidosModule],
})
export class AppModule {}
