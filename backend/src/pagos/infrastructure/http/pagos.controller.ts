import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ProcesarTransaccion } from '../../application/pagos.js';
import { FirmaInvalida, PASARELA_PAGOS, PasarelaNoConfigurada, type PasarelaPagos } from '../../domain/pago.js';

@Controller('pagos/wompi')
export class PagosController {
  constructor(
    private readonly procesar: ProcesarTransaccion,
    @Inject(PASARELA_PAGOS) private readonly pasarela: PasarelaPagos,
  ) {}

  // URL de eventos que se registra en el panel de Wompi. Responder 200 evita reintentos.
  @Post('eventos')
  @HttpCode(200)
  async eventos(@Body() cuerpo: unknown) {
    try {
      const t = this.pasarela.leerEvento(cuerpo);
      if (t) await this.procesar.ejecutar(t);
      return { ok: true };
    } catch (e) {
      if (e instanceof FirmaInvalida) throw new UnauthorizedException('Firma inválida');
      if (e instanceof PasarelaNoConfigurada) throw new ServiceUnavailableException();
      throw e;
    }
  }

  // La tienda la llama cuando la clienta vuelve de Wompi con ?id=<transacción>.
  @Post('verificar')
  @HttpCode(200)
  async verificar(@Body() cuerpo: { transaccionId?: unknown }) {
    const id = cuerpo?.transaccionId;
    if (typeof id !== 'string' || !/^[A-Za-z0-9-]{5,64}$/.test(id)) throw new BadRequestException('transaccionId inválido');
    await this.procesar.verificar(id);
    return { ok: true };
  }
}
