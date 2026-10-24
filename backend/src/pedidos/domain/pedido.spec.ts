import {
  armarPedido,
  DatosInvalidos,
  devuelveStock,
  TransicionInvalida,
  validarCambioEstado,
  validarSolicitud,
  type VarianteVendible,
} from './pedido.js';

const ahora = new Date('2026-10-14T12:00:00Z');
const valida = {
  items: [
    { sku: 'BLU-S', cantidad: 1 },
    { sku: 'BLU-S', cantidad: 2 },
    { sku: 'LAB-1', cantidad: 1 },
  ],
  contacto: { nombre: '  Ana   María Pérez ', email: 'Ana@Correo.CO', telefono: '+57 300 123 4567', aceptaDatos: true },
  envio: { departamento: 'Antioquia', ciudad: 'Medellín', direccion: 'Calle 10 # 20-30', indicaciones: '' },
};
const variantes: VarianteVendible[] = [
  { varianteId: 1, sku: 'BLU-S', nombre: 'Blusa', activo: true, precio: 100000, stock: 5 },
  { varianteId: 2, sku: 'LAB-1', nombre: 'Labial', activo: true, precio: 30000, stock: 1 },
];

describe('Pedido: solicitud del checkout', () => {
  it('normaliza contacto, une SKUs repetidos y registra el consentimiento', () => {
    const s = validarSolicitud(valida, ahora);
    expect(s.items).toEqual([{ sku: 'BLU-S', cantidad: 3 }, { sku: 'LAB-1', cantidad: 1 }]);
    expect(s.contacto).toEqual({ nombre: 'Ana María Pérez', email: 'ana@correo.co', telefono: '3001234567', aceptaDatosEn: ahora.toISOString() });
  });

  it('exige consentimiento de datos, celular colombiano y departamento válido', () => {
    const mala = { ...valida, contacto: { ...valida.contacto, telefono: '12345', aceptaDatos: false }, envio: { ...valida.envio, departamento: 'Texas' } };
    try {
      validarSolicitud(mala, ahora);
      throw new Error('debió fallar');
    } catch (e) {
      expect((e as DatosInvalidos).errores).toEqual([
        'Escribe un celular colombiano de 10 dígitos',
        'Debes aceptar la política de tratamiento de datos',
        'Elige un departamento',
      ]);
    }
    expect(() => validarSolicitud({ ...valida, items: [] }, ahora)).toThrow(DatosInvalidos);
    expect(() => validarSolicitud(null, ahora)).toThrow(DatosInvalidos);
  });
});

describe('Pedido: precios, envío y stock', () => {
  it('usa los precios del catálogo y cobra envío por debajo del mínimo', () => {
    const p = armarPedido(validarSolicitud({ ...valida, items: [{ sku: 'LAB-1', cantidad: 1 }] }, ahora), variantes);
    expect([p.subtotal, p.costoEnvio, p.total]).toEqual([30000, 12000, 42000]);
  });

  it('da envío gratis desde 250.000', () => {
    const p = armarPedido(validarSolicitud(valida, ahora), variantes);
    expect([p.subtotal, p.costoEnvio, p.total]).toEqual([330000, 0, 330000]);
    expect(p.lineas.map((l) => l.precioUnitario)).toEqual([100000, 30000]);
  });

  it('rechaza falta de stock y productos inactivos o inexistentes', () => {
    const sinStock = variantes.map((v) => ({ ...v, stock: v.sku === 'BLU-S' ? 2 : 0 }));
    expect(() => armarPedido(validarSolicitud(valida, ahora), sinStock)).toThrow(/solo quedan 2/);
    const inactiva = [{ ...variantes[0], activo: false }, variantes[1]];
    expect(() => armarPedido(validarSolicitud(valida, ahora), inactiva)).toThrow(/ya no está disponible/);
    expect(() => armarPedido(validarSolicitud(valida, ahora), [])).toThrow(DatosInvalidos);
  });
});

describe('Pedido: cambios de estado desde el panel', () => {
  it('sigue el flujo pagado -> preparando -> enviado (con guía) -> entregado', () => {
    expect(validarCambioEstado('pagado', 'preparando', '')).toEqual({ estado: 'preparando', guia: null });
    expect(validarCambioEstado('preparando', 'enviado', ' 123456 ')).toEqual({ estado: 'enviado', guia: '123456' });
    expect(validarCambioEstado('enviado', 'entregado', '')).toEqual({ estado: 'entregado', guia: null });
  });

  it('impide saltos, marcar pagado a mano y enviar sin guía', () => {
    expect(() => validarCambioEstado('pendiente_pago', 'pagado', '')).toThrow(TransicionInvalida);
    expect(() => validarCambioEstado('pagado', 'entregado', '')).toThrow(TransicionInvalida);
    expect(() => validarCambioEstado('preparando', 'enviado', '')).toThrow(/guía/);
    expect(() => validarCambioEstado('entregado', 'cancelado', '')).toThrow(TransicionInvalida);
  });

  it('devuelve stock solo al cancelar pedidos que ya lo descontaron', () => {
    expect(['pendiente_pago', 'pagado', 'preparando'].map((e) => devuelveStock(e as never))).toEqual([false, true, true]);
  });
});
