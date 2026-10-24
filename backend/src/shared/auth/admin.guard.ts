import { createHash, timingSafeEqual } from 'node:crypto';
import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

const digerir = (s: string) => createHash('sha256').update(s).digest();

// Protege las rutas de administración con `Authorization: Bearer <ADMIN_TOKEN>`.
// Sin ADMIN_TOKEN (o con uno corto) el panel queda cerrado.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(contexto: ExecutionContext) {
    const esperado = process.env.ADMIN_TOKEN ?? '';
    const cabecera = contexto.switchToHttp().getRequest<Request>().headers.authorization ?? '';
    const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : '';
    if (esperado.length < 32 || !timingSafeEqual(digerir(token), digerir(esperado))) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
