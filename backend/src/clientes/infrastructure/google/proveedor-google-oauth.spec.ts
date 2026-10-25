import { ProveedorGoogleOAuth } from './proveedor-google-oauth.js';

const ENTORNO = { GOOGLE_CLIENT_ID: 'id-de-prueba.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 'secreto-de-prueba', FRONTEND_URL: 'https://tienda.test' };

describe('Google OAuth', () => {
  beforeEach(() => Object.assign(process.env, ENTORNO));
  afterEach(() => {
    vi.restoreAllMocks();
    Object.keys(ENTORNO).forEach((k) => delete process.env[k]);
  });

  it('sin credenciales no está configurado', () => {
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(new ProveedorGoogleOAuth().configurado()).toBe(false);
  });

  it('arma la URL con PKCE, state y la URL de retorno fija de la tienda', () => {
    const url = new URL(new ProveedorGoogleOAuth().urlAutorizacion('estado-123', 'reto-456'));
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      client_id: ENTORNO.GOOGLE_CLIENT_ID,
      redirect_uri: 'https://tienda.test/cuenta/google/retorno',
      state: 'estado-123',
      code_challenge: 'reto-456',
      code_challenge_method: 'S256',
      scope: 'openid email profile',
    });
  });

  it('cambia el código con el verificador PKCE y lee el perfil', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json({ access_token: 'token-acceso' }))
      .mockResolvedValueOnce(Response.json({ sub: '123', email: 'lu@gmail.com', email_verified: true, name: 'Lu' }));
    expect(await new ProveedorGoogleOAuth().perfil('codigo', 'verificador')).toEqual({ sub: '123', email: 'lu@gmail.com', emailVerificado: true, nombre: 'Lu' });
    const cuerpo = new URLSearchParams(String(fetch.mock.calls[0][1]?.body));
    expect(cuerpo.get('code_verifier')).toBe('verificador');
    expect(cuerpo.get('redirect_uri')).toBe('https://tienda.test/cuenta/google/retorno');
    expect(fetch.mock.calls[1][1]).toMatchObject({ headers: { authorization: 'Bearer token-acceso' } });
  });

  it('falla si Google rechaza el código', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 400 }));
    await expect(new ProveedorGoogleOAuth().perfil('codigo', 'verificador')).rejects.toThrow('400');
  });
});
