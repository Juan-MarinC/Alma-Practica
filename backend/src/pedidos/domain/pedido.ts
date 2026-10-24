// Dominio puro de pedidos: no depende de NestJS, Postgres ni Wompi.
export const ESTADOS_PEDIDO = ['pendiente_pago', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado'] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

// Igual que frontend/src/lib/config.ts (allá solo se muestra; aquí se cobra).
export const TARIFAS_ENVIO = { fijo: 12000, gratisDesde: 250000 };

export const DEPARTAMENTOS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá',
  'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira',
  'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada',
];

export type Contacto = { nombre: string; email: string; telefono: string; aceptaDatosEn: string };
export type Envio = { departamento: string; ciudad: string; direccion: string; indicaciones: string };
export type ItemSolicitado = { sku: string; cantidad: number };
export type SolicitudPedido = { items: ItemSolicitado[]; contacto: Contacto; envio: Envio };

// Lo que el catálogo sabe hoy de cada variante pedida.
export type VarianteVendible = { varianteId: number; sku: string; nombre: string; activo: boolean; precio: number; stock: number };

export type LineaPedido = { varianteId: number; sku: string; nombre: string; cantidad: number; precioUnitario: number };
export type PedidoNuevo = {
  contacto: Contacto;
  envio: Envio;
  lineas: LineaPedido[];
  subtotal: number;
  costoEnvio: number;
  total: number;
};

export class DatosInvalidos extends Error {
  constructor(readonly errores: string[]) {
    super(errores.join('; '));
  }
}
export class PedidoNoEncontrado extends Error {}
export class TransicionInvalida extends Error {}

const SKU = /^[A-Za-z0-9._-]{1,64}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const texto = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');

export function calcularEnvio(subtotal: number) {
  return subtotal >= TARIFAS_ENVIO.gratisDesde ? 0 : TARIFAS_ENVIO.fijo;
}

/** Valida lo que envía el checkout. `ahora` se inyecta para registrar cuándo se aceptó el tratamiento de datos. */
export function validarSolicitud(datos: unknown, ahora: Date): SolicitudPedido {
  const o = esObjeto(datos) ? datos : {};
  const c = esObjeto(o.contacto) ? o.contacto : {};
  const e = esObjeto(o.envio) ? o.envio : {};
  const errores: string[] = [];

  const crudos = Array.isArray(o.items) ? o.items : [];
  if (crudos.length === 0 || crudos.length > 30) errores.push('Tu bolsa está vacía o tiene demasiados productos');
  const porSku = new Map<string, number>();
  for (const crudo of crudos) {
    const i = esObjeto(crudo) ? crudo : {};
    const sku = texto(i.sku);
    if (!SKU.test(sku) || !Number.isInteger(i.cantidad) || (i.cantidad as number) < 1) {
      errores.push('Hay un producto inválido en tu bolsa');
      break;
    }
    porSku.set(sku, (porSku.get(sku) ?? 0) + (i.cantidad as number));
  }
  if ([...porSku.values()].some((n) => n > 20)) errores.push('Máximo 20 unidades por producto');

  const nombre = texto(c.nombre);
  const email = texto(c.email).toLowerCase();
  const telefono = texto(c.telefono).replace(/[\s()-]/g, '').replace(/^\+?57/, '');
  if (nombre.length < 3 || nombre.length > 120) errores.push('Escribe tu nombre completo');
  if (!EMAIL.test(email) || email.length > 254) errores.push('Revisa tu correo electrónico');
  if (!/^3\d{9}$/.test(telefono)) errores.push('Escribe un celular colombiano de 10 dígitos');
  if (c.aceptaDatos !== true) errores.push('Debes aceptar la política de tratamiento de datos');

  const departamento = texto(e.departamento);
  const ciudad = texto(e.ciudad);
  const direccion = texto(e.direccion);
  const indicaciones = texto(e.indicaciones);
  if (!DEPARTAMENTOS.includes(departamento)) errores.push('Elige un departamento');
  if (ciudad.length < 2 || ciudad.length > 80) errores.push('Escribe la ciudad o municipio');
  if (direccion.length < 5 || direccion.length > 200) errores.push('Escribe la dirección completa');
  if (indicaciones.length > 200) errores.push('Las indicaciones pueden tener máximo 200 caracteres');

  if (errores.length) throw new DatosInvalidos(errores);
  return {
    items: [...porSku].map(([sku, cantidad]) => ({ sku, cantidad })),
    contacto: { nombre, email, telefono, aceptaDatosEn: ahora.toISOString() },
    envio: { departamento, ciudad, direccion, indicaciones },
  };
}

/** Arma el pedido con los precios y el stock actuales. El stock se descuenta después, al aprobarse el pago. */
export function armarPedido(solicitud: SolicitudPedido, variantes: VarianteVendible[]): PedidoNuevo {
  const errores: string[] = [];
  const lineas = solicitud.items.flatMap(({ sku, cantidad }) => {
    const v = variantes.find((x) => x.sku === sku);
    if (!v || !v.activo) {
      errores.push('Un producto de tu bolsa ya no está disponible; quítalo para continuar');
      return [];
    }
    if (v.stock < cantidad)
      errores.push(v.stock === 0 ? `"${v.nombre}" se agotó` : `De "${v.nombre}" solo quedan ${v.stock}`);
    return [{ varianteId: v.varianteId, sku, nombre: v.nombre, cantidad, precioUnitario: v.precio }];
  });
  if (errores.length) throw new DatosInvalidos([...new Set(errores)]);
  const subtotal = lineas.reduce((s, l) => s + l.precioUnitario * l.cantidad, 0);
  const costoEnvio = calcularEnvio(subtotal);
  return { contacto: solicitud.contacto, envio: solicitud.envio, lineas, subtotal, costoEnvio, total: subtotal + costoEnvio };
}

// Cambios de estado que puede hacer el panel. pendiente_pago -> pagado solo lo hace la pasarela.
const TRANSICIONES: Record<EstadoPedido, EstadoPedido[]> = {
  pendiente_pago: ['cancelado'],
  pagado: ['preparando', 'cancelado'],
  preparando: ['enviado', 'cancelado'],
  enviado: ['entregado'],
  entregado: [],
  cancelado: [],
};

export function validarCambioEstado(actual: EstadoPedido, nuevo: unknown, guia: unknown): { estado: EstadoPedido; guia: string | null } {
  const estado = ESTADOS_PEDIDO.find((e) => e === nuevo);
  if (!estado || !TRANSICIONES[actual].includes(estado))
    throw new TransicionInvalida(`No se puede pasar de "${actual}" a "${String(nuevo)}"`);
  const g = texto(guia);
  if (estado === 'enviado' && (g.length < 3 || g.length > 60)) throw new TransicionInvalida('Escribe el número de guía');
  return { estado, guia: estado === 'enviado' ? g : null };
}

/** Al cancelar un pedido que ya descontó stock hay que devolverlo. */
export const devuelveStock = (actual: EstadoPedido) => actual === 'pagado' || actual === 'preparando';
