import type { Contacto, Envio, EstadoPedido, PedidoNuevo, VarianteVendible } from './pedido.js';

export const REPOSITORIO_PEDIDOS = Symbol('RepositorioPedidos');

export type LineaResumen = { nombre: string; opciones: Record<string, string>; cantidad: number; precioUnitario: number };

// Lo que puede ver cualquiera con el enlace del pedido: sin datos personales.
export type ResumenPedido = {
  id: string;
  numero: number;
  estado: EstadoPedido;
  lineas: LineaResumen[];
  subtotal: number;
  costoEnvio: number;
  total: number;
  guiaEnvio: string | null;
  creadoEn: string;
  pagoEstado: string | null;
};

export type PedidoAdmin = Omit<ResumenPedido, 'pagoEstado'> & {
  contacto: Contacto;
  envio: Envio;
  pago: { referencia: string; estado: string; metodo: string | null } | null;
};

export type FilaPedidoAdmin = {
  id: string;
  numero: number;
  estado: EstadoPedido;
  total: number;
  creadoEn: string;
  cliente: string;
  ciudad: string;
  pagoEstado: string | null;
};

export interface RepositorioPedidos {
  variantesVendibles(skus: string[]): Promise<VarianteVendible[]>;
  crear(pedido: PedidoNuevo): Promise<{ id: string; numero: number }>;
  resumen(id: string): Promise<ResumenPedido | null>;
  detalleAdmin(id: string): Promise<PedidoAdmin | null>;
  listarAdmin(): Promise<FilaPedidoAdmin[]>;
  /**
   * Bloquea el pedido, pide a `decidir` el nuevo estado según el actual y, si se cancela un
   * pedido que ya había descontado stock, lo devuelve. Todo en una transacción.
   */
  cambiarEstado(
    id: string,
    decidir: (actual: EstadoPedido) => { estado: EstadoPedido; guia: string | null },
  ): Promise<void>;
}
