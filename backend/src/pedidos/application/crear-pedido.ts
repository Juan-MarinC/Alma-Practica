import { Inject, Injectable } from '@nestjs/common';
import { armarPedido, validarSolicitud } from '../domain/pedido.js';
import { REPOSITORIO_PEDIDOS, type RepositorioPedidos } from '../domain/repositorio-pedidos.js';

@Injectable()
export class CrearPedido {
  constructor(@Inject(REPOSITORIO_PEDIDOS) private readonly repositorio: RepositorioPedidos) {}

  /** Crea el pedido en `pendiente_pago` con los precios actuales del catálogo (nunca los del navegador). */
  async ejecutar(datos: unknown) {
    const solicitud = validarSolicitud(datos, new Date());
    const variantes = await this.repositorio.variantesVendibles(solicitud.items.map((i) => i.sku));
    const pedido = armarPedido(solicitud, variantes);
    const { id, numero } = await this.repositorio.crear(pedido);
    return { id, numero, total: pedido.total };
  }
}
