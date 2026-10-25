import { type CanActivate, createParamDecorator, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ResolverSesion } from '../../application/acceso.js';

export type ClienteEnSesion = { id: string; token: string };
type ConCliente = Request & { cliente?: ClienteEnSesion };

export const tokenBearer = (cabecera: string | undefined) => (cabecera?.startsWith('Bearer ') ? cabecera.slice(7) : null);

// Rutas de la cuenta: `Authorization: Bearer <token de sesión>` que envía el servidor de Next desde su cookie.
@Injectable()
export class ClienteGuard implements CanActivate {
  constructor(private readonly resolver: ResolverSesion) {}

  async canActivate(contexto: ExecutionContext) {
    const req = contexto.switchToHttp().getRequest<ConCliente>();
    const token = tokenBearer(req.headers.authorization);
    const id = await this.resolver.ejecutar(token);
    if (!id || !token) throw new UnauthorizedException();
    req.cliente = { id, token };
    return true;
  }
}

export const ClienteActual = createParamDecorator((_: unknown, contexto: ExecutionContext) => contexto.switchToHttp().getRequest<ConCliente>().cliente!);
