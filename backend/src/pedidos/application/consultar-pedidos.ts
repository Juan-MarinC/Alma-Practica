import { Inject, Injectable } from '@nestjs/common';
import { PedidoNoEncontrado, validarCambioEstado } from '../domain/pedido.js';
import { REPOSITORIO_PEDIDOS, type RepositorioPedidos } from '../domain/repositorio-pedidos.js';

// Vista pública por enlace (id UUID): estado y productos, sin datos personales.
@Injectable()
export class ConsultarPedido {
  constructor(@Inject(REPOSITORIO_PEDIDOS) private readonly repositorio: RepositorioPedidos) {}

  async ejecutar(id: string) {
    const pedido = await this.repositorio.resumen(id);
    if (!pedido) throw new PedidoNoEncontrado(`No existe el pedido ${id}`);
    return pedido;
  }
}

@Injectable()
export class ListarPedidosAdmin {
  constructor(@Inject(REPOSITORIO_PEDIDOS) private readonly repositorio: RepositorioPedidos) {}

  ejecutar() {
    return this.repositorio.listarAdmin();
  }
}

@Injectable()
export class ObtenerPedidoAdmin {
  constructor(@Inject(REPOSITORIO_PEDIDOS) private readonly repositorio: RepositorioPedidos) {}

  async ejecutar(id: string) {
    const pedido = await this.repositorio.detalleAdmin(id);
    if (!pedido) throw new PedidoNoEncontrado(`No existe el pedido ${id}`);
    return pedido;
  }
}

@Injectable()
export class CambiarEstadoPedido {
  constructor(@Inject(REPOSITORIO_PEDIDOS) private readonly repositorio: RepositorioPedidos) {}

  ejecutar(id: string, datos: { estado?: unknown; guiaEnvio?: unknown }) {
    return this.repositorio.cambiarEstado(id, (actual) => validarCambioEstado(actual, datos?.estado, datos?.guiaEnvio));
  }
}
