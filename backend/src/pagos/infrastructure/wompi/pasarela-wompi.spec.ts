import { createHash } from 'node:crypto';
import { FirmaInvalida } from '../../domain/pago.js';
import { checksumEvento, firmaIntegridad, PasarelaWompi } from './pasarela-wompi.js';

// Llaves de prueba inventadas (no son de ninguna cuenta real).
const ENTORNO = {
  WOMPI_LLAVE_PUBLICA: 'pub_test_prueba',
  WOMPI_SECRETO_INTEGRIDAD: 'test_integrity_prueba',
  WOMPI_SECRETO_EVENTOS: 'test_events_prueba',
};

function evento(transaccion: Record<string, unknown>, secreto = ENTORNO.WOMPI_SECRETO_EVENTOS) {
  const base = {
    event: 'transaction.updated',
    data: { transaction: transaccion },
    signature: { properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'], checksum: '' },
    timestamp: 1760450000,
  };
  const t = transaccion as { id: string; status: string; amount_in_cents: number };
  base.signature.checksum = createHash('sha256')
    .update(`${t.id}${t.status}${t.amount_in_cents}${base.timestamp}${secreto}`)
    .digest('hex')
    .toUpperCase(); // Wompi lo envía en mayúsculas
  return base;
}

const tx = { id: '1234-1760450000-12345', status: 'APPROVED', amount_in_cents: 4200000, reference: 'ALMA-7-abcd1234', currency: 'COP', payment_method_type: 'NEQUI', customer_email: 'clienta@correo.co' };

describe('Wompi', () => {
  beforeEach(() => Object.assign(process.env, ENTORNO));
  afterEach(() => Object.keys(ENTORNO).forEach((k) => delete process.env[k]));

  it('calcula la firma de integridad igual que el ejemplo oficial de Wompi', () => {
    expect(firmaIntegridad('sk8-438k4-xmxm392-sn2m', 2490000, 'COP', 'prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6')).toBe(
      '37c8407747e595535433ef8f6a811d853cd943046624a0ec04662b17bbf33bf5',
    );
  });

  it('arma la URL de checkout firmada y sin datos personales', () => {
    const url = new URL(new PasarelaWompi().urlCheckout({ referencia: 'ALMA-7-abcd1234', montoCentavos: 4200000, urlRetorno: 'http://localhost:3000/pedido/x' }));
    expect(url.origin + url.pathname).toBe('https://checkout.wompi.co/p/');
    expect(url.searchParams.get('signature:integrity')).toBe(firmaIntegridad('ALMA-7-abcd1234', 4200000, 'COP', ENTORNO.WOMPI_SECRETO_INTEGRIDAD));
    expect([...url.searchParams.keys()].some((k) => k.startsWith('customer-data'))).toBe(false);
  });

  it('acepta eventos bien firmados y lee la transacción', () => {
    expect(new PasarelaWompi().leerEvento(evento(tx))).toEqual({
      id: tx.id,
      referencia: tx.reference,
      estado: 'APPROVED',
      montoCentavos: 4200000,
      moneda: 'COP',
      metodo: 'NEQUI',
    });
  });

  it('rechaza eventos alterados, con otro secreto o sin firma', () => {
    const p = new PasarelaWompi();
    const alterado = evento(tx);
    alterado.data.transaction = { ...tx, amount_in_cents: 100 };
    expect(() => p.leerEvento(alterado)).toThrow(FirmaInvalida);
    expect(() => p.leerEvento(evento(tx, 'otro_secreto'))).toThrow(FirmaInvalida);
    expect(() => p.leerEvento({ event: 'transaction.updated', data: { transaction: tx } })).toThrow(FirmaInvalida);
    expect(() => p.leerEvento(null)).toThrow(FirmaInvalida);
  });

  it('ignora eventos firmados que no son de transacciones', () => {
    const otro = { ...evento(tx), event: 'nequi_token.updated' };
    expect(new PasarelaWompi().leerEvento(otro)).toBeNull();
  });

  it('el checksum depende de las propiedades que indique el evento', () => {
    expect(checksumEvento({ data: {}, signature: { properties: ['transaction.id'] }, timestamp: 1 }, 's')).toBeNull();
  });

  describe('consultar una transacción', () => {
    afterEach(() => {
      vi.restoreAllMocks();
      delete process.env.WOMPI_LLAVE_PRIVADA;
    });

    it('sin llave privada no le pregunta a Wompi (no se puede comprobar que la transacción sea de este comercio)', async () => {
      const fetch = vi.spyOn(globalThis, 'fetch');
      expect(await new PasarelaWompi().consultar(tx.id)).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('consulta con la llave privada y lee la transacción', async () => {
      process.env.WOMPI_LLAVE_PRIVADA = 'prv_test_prueba';
      const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ data: tx }));
      expect(await new PasarelaWompi().consultar(tx.id)).toMatchObject({ id: tx.id, referencia: tx.reference, estado: 'APPROVED' });
      const [url, init] = fetch.mock.calls[0];
      expect(String(url)).toMatch(/\/transactions\/1234-1760450000-12345$/);
      expect(init).toMatchObject({ headers: { authorization: 'Bearer prv_test_prueba' } });
    });

    it('una transacción que Wompi no reconoce para este comercio (404) no se aplica', async () => {
      process.env.WOMPI_LLAVE_PRIVADA = 'prv_test_prueba';
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 404 }));
      expect(await new PasarelaWompi().consultar('otra-transaccion')).toBeNull();
    });
  });
});
