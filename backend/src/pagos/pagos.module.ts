import { Module } from '@nestjs/common';
import { CORREO, CorreoResend } from '../shared/correo/correo.js';
import { IniciarPago, ProcesarTransaccion } from './application/pagos.js';
import { PASARELA_PAGOS, REPOSITORIO_PAGOS } from './domain/pago.js';
import { PagosController } from './infrastructure/http/pagos.controller.js';
import { RepositorioPagosPostgres } from './infrastructure/postgres/repositorio-pagos-postgres.js';
import { PasarelaWompi } from './infrastructure/wompi/pasarela-wompi.js';

@Module({
  controllers: [PagosController],
  providers: [
    IniciarPago,
    ProcesarTransaccion,
    { provide: PASARELA_PAGOS, useClass: PasarelaWompi },
    { provide: REPOSITORIO_PAGOS, useClass: RepositorioPagosPostgres },
    { provide: CORREO, useClass: CorreoResend },
  ],
  exports: [IniciarPago],
})
export class PagosModule {}
