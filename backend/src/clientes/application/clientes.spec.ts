import type { Correo, Mensaje } from '../../shared/correo/correo.js';
import {
  CorreoEnUso,
  CredencialesInvalidas,
  DatosInvalidos,
  DemasiadosIntentos,
  EnlaceInvalido,
  validarDireccion,
  validarRegistro,
  type PerfilGoogle,
} from '../domain/cliente.js';
import type { ProveedorGoogle } from '../domain/proveedor-google.js';
import { hashContrasena, hashToken, verificarContrasena } from '../domain/secretos.js';
import { RepositorioClientesMemoria } from '../infrastructure/memoria/repositorio-clientes-memoria.js';
import { IniciarSesion, RegistrarCliente, ResolverSesion, TerminarGoogle } from './acceso.js';
import { CambiarContrasena, RestablecerContrasena, SolicitarRestablecer, VerificarEmail } from './contrasenas.js';
import { AgregarDireccion, BorrarDireccion, EliminarCuenta, PedidosDeCliente } from './cuenta.js';

class CorreoPrueba implements Correo {
  readonly enviados: Mensaje[] = [];
  async enviar(m: Mensaje) {
    this.enviados.push(m);
  }
  /** Token del último enlace enviado (lo que la clienta abriría desde su correo). */
  ultimoToken() {
    return /token=([A-Za-z0-9_-]+)/.exec(this.enviados.at(-1)?.html ?? '')?.[1] ?? '';
  }
}

const datos = (extra: Record<string, unknown> = {}) => ({
  nombre: 'Ana Gómez',
  email: '  Ana@Correo.co ',
  telefono: '300 123 4567',
  contrasena: 'una-clave-larga-1',
  aceptaDatos: true,
  ...extra,
});

function entorno() {
  const repo = new RepositorioClientesMemoria();
  const correo = new CorreoPrueba();
  return { repo, correo, registrar: new RegistrarCliente(repo, correo), entrar: new IniciarSesion(repo), sesion: new ResolverSesion(repo) };
}

describe('Validación de cuentas', () => {
  it('normaliza el registro y exige lo necesario', () => {
    const r = validarRegistro(datos(), new Date('2026-01-01'));
    expect(r).toMatchObject({ nombre: 'Ana Gómez', email: 'ana@correo.co', telefono: '3001234567' });
    expect(() => validarRegistro(datos({ contrasena: 'corta', aceptaDatos: false, email: 'x' }), new Date())).toThrow(DatosInvalidos);
    expect(() => validarRegistro(datos({ contrasena: '1234567890' }), new Date())).toThrow(DatosInvalidos);
    expect(validarRegistro(datos({ telefono: '' }), new Date()).telefono).toBeNull();
  });

  it('valida direcciones con los departamentos de Colombia', () => {
    expect(validarDireccion({ departamento: 'Antioquia', ciudad: 'Medellín', direccion: 'Calle 10 # 20-30' }).indicaciones).toBe('');
    expect(() => validarDireccion({ departamento: 'Texas', ciudad: 'X', direccion: '1' })).toThrow(DatosInvalidos);
  });

  it('guarda contraseñas con scrypt y sal distinta', async () => {
    const a = await hashContrasena('una-clave-larga-1');
    const b = await hashContrasena('una-clave-larga-1');
    expect(a).not.toBe(b);
    expect(a.startsWith('scrypt$')).toBe(true);
    expect(await verificarContrasena('una-clave-larga-1', a)).toBe(true);
    expect(await verificarContrasena('otra-clave-larga', a)).toBe(false);
    expect(await verificarContrasena('una-clave-larga-1', 'basura')).toBe(false);
  });
});

describe('Cuentas de clientas', () => {
  it('registra, deja la sesión abierta y envía el correo de confirmación', async () => {
    const { repo, correo, registrar, sesion } = entorno();
    const token = await registrar.ejecutar(datos());
    const id = await sesion.ejecutar(token);
    expect(id).toBeTruthy();
    expect(repo.sesiones.has(token)).toBe(false); // en la base solo queda el hash
    expect(repo.sesiones.has(hashToken(token))).toBe(true);
    expect(correo.enviados[0].asunto).toBe('Confirma tu correo');
    expect((await repo.porId(id!))?.emailVerificado).toBe(false);
    await expect(registrar.ejecutar(datos())).rejects.toThrow(CorreoEnUso);
  });

  it('inicia sesión con el correo en cualquier mayúscula y rechaza la contraseña equivocada', async () => {
    const { registrar, entrar, sesion } = entorno();
    await registrar.ejecutar(datos());
    expect(await sesion.ejecutar(await entrar.ejecutar({ email: 'ANA@correo.co', contrasena: 'una-clave-larga-1' }))).toBeTruthy();
    await expect(entrar.ejecutar({ email: 'ana@correo.co', contrasena: 'equivocada-123' })).rejects.toThrow(CredencialesInvalidas);
    await expect(entrar.ejecutar({ email: 'nadie@correo.co', contrasena: 'una-clave-larga-1' })).rejects.toThrow(CredencialesInvalidas);
  });

  it('bloquea un correo tras 10 contraseñas equivocadas', async () => {
    const { registrar, entrar } = entorno();
    await registrar.ejecutar(datos({ email: 'bloqueo@correo.co' }));
    for (let i = 0; i < 10; i++) await expect(entrar.ejecutar({ email: 'bloqueo@correo.co', contrasena: `mala-clave-${i}` })).rejects.toThrow(CredencialesInvalidas);
    await expect(entrar.ejecutar({ email: 'bloqueo@correo.co', contrasena: 'una-clave-larga-1' })).rejects.toThrow(DemasiadosIntentos);
  });

  it('restablecer la contraseña quita el bloqueo por intentos fallidos', async () => {
    const { repo, correo, registrar, entrar } = entorno();
    await registrar.ejecutar(datos({ email: 'bloqueada@correo.co' }));
    for (let i = 0; i < 10; i++) await expect(entrar.ejecutar({ email: 'bloqueada@correo.co', contrasena: `mala-clave-${i}` })).rejects.toThrow();
    await expect(entrar.ejecutar({ email: 'bloqueada@correo.co', contrasena: 'una-clave-larga-1' })).rejects.toThrow(DemasiadosIntentos);
    await new SolicitarRestablecer(repo, correo).ejecutar({ email: 'bloqueada@correo.co' });
    await new RestablecerContrasena(repo).ejecutar({ token: correo.ultimoToken(), contrasena: 'clave-nueva-larga' });
    await expect(entrar.ejecutar({ email: 'bloqueada@correo.co', contrasena: 'clave-nueva-larga' })).resolves.toBeTruthy();
  });

  it('restablece la contraseña con el enlace (un solo uso) y cierra todas las sesiones', async () => {
    const { repo, correo, registrar, entrar, sesion } = entorno();
    const token = await registrar.ejecutar(datos({ email: 'olvido@correo.co' }));
    await new SolicitarRestablecer(repo, correo).ejecutar({ email: 'OLVIDO@correo.co' });
    const enlace = correo.ultimoToken();
    const restablecer = new RestablecerContrasena(repo);
    await restablecer.ejecutar({ token: enlace, contrasena: 'clave-nueva-larga' });
    expect(await sesion.ejecutar(token)).toBeNull();
    await expect(restablecer.ejecutar({ token: enlace, contrasena: 'otra-clave-larga' })).rejects.toThrow(EnlaceInvalido);
    expect(await sesion.ejecutar(await entrar.ejecutar({ email: 'olvido@correo.co', contrasena: 'clave-nueva-larga' }))).toBeTruthy();
  });

  it('no revela si un correo tiene cuenta al pedir el enlace', async () => {
    const { repo, correo } = entorno();
    await expect(new SolicitarRestablecer(repo, correo).ejecutar({ email: 'no-existe@correo.co' })).resolves.toBeUndefined();
    expect(correo.enviados).toHaveLength(0);
  });

  it('cambiar la contraseña exige la actual y deja abierta solo la sesión actual', async () => {
    const { repo, registrar, entrar, sesion } = entorno();
    const actual = await registrar.ejecutar(datos({ email: 'cambio@correo.co' }));
    const otra = await entrar.ejecutar({ email: 'cambio@correo.co', contrasena: 'una-clave-larga-1' });
    const id = (await sesion.ejecutar(actual))!;
    const cambiar = new CambiarContrasena(repo);
    await expect(cambiar.ejecutar(id, actual, { actual: 'equivocada-123', nueva: 'clave-nueva-larga' })).rejects.toThrow(DatosInvalidos);
    await cambiar.ejecutar(id, actual, { actual: 'una-clave-larga-1', nueva: 'clave-nueva-larga' });
    expect(await sesion.ejecutar(actual)).toBe(id);
    expect(await sesion.ejecutar(otra)).toBeNull();
  });

  it('muestra las compras como invitada solo después de confirmar el correo', async () => {
    const { repo, correo, registrar, sesion } = entorno();
    const id = (await sesion.ejecutar(await registrar.ejecutar(datos({ email: 'invitada@correo.co' }))))!;
    const base = { estado: 'pagado', total: 50000, unidades: 1, creadoEn: '2026-01-01' };
    repo.pedidosGuardados.push({ ...base, id: 'p1', numero: 1, clienteId: null, email: 'invitada@correo.co' });
    repo.pedidosGuardados.push({ ...base, id: 'p2', numero: 2, clienteId: id, email: 'invitada@correo.co' });
    repo.pedidosGuardados.push({ ...base, id: 'p3', numero: 3, clienteId: null, email: 'otra@correo.co' });
    const pedidos = new PedidosDeCliente(repo);
    expect((await pedidos.ejecutar(id)).map((p) => p.id)).toEqual(['p2']);
    await new VerificarEmail(repo).ejecutar(id, { token: correo.ultimoToken() });
    expect((await pedidos.ejecutar(id)).map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('el enlace de confirmación solo sirve con la sesión de la misma cuenta', async () => {
    const { repo, correo, registrar, sesion } = entorno();
    const intruso = (await sesion.ejecutar(await registrar.ejecutar(datos({ email: 'ajeno@correo.co' }))))!;
    const enlace = correo.ultimoToken();
    const otra = (await sesion.ejecutar(await registrar.ejecutar(datos({ email: 'otra@correo.co' }))))!;
    // La dueña del correo abre el enlace estando en otra cuenta (o sin sesión): no confirma la cuenta del intruso.
    await expect(new VerificarEmail(repo).ejecutar(otra, { token: enlace })).rejects.toThrow(EnlaceInvalido);
    expect((await repo.porId(intruso))?.emailVerificado).toBe(false);
  });

  it('cada clienta solo borra sus direcciones y eliminar la cuenta borra todo menos los pedidos', async () => {
    const { repo, registrar, sesion } = entorno();
    const ana = (await sesion.ejecutar(await registrar.ejecutar(datos({ email: 'a@correo.co' }))))!;
    const eva = (await sesion.ejecutar(await registrar.ejecutar(datos({ email: 'e@correo.co' }))))!;
    const dir = await new AgregarDireccion(repo).ejecutar(ana, { departamento: 'Antioquia', ciudad: 'Medellín', direccion: 'Calle 10 # 20-30' });
    expect(await new BorrarDireccion(repo).ejecutar(eva, dir.id)).toBe(false);
    repo.pedidosGuardados.push({ id: 'p', numero: 9, estado: 'pagado', total: 1, unidades: 1, creadoEn: '', clienteId: ana, email: 'a@correo.co' });
    const eliminar = new EliminarCuenta(repo);
    await expect(eliminar.ejecutar(ana, { confirmacion: 'si' })).rejects.toThrow(DatosInvalidos);
    await eliminar.ejecutar(ana, { confirmacion: 'ELIMINAR' });
    expect(await repo.porId(ana)).toBeNull();
    expect(await repo.direcciones(ana)).toEqual([]);
    expect(repo.pedidosGuardados[0].clienteId).toBeNull();
  });
});

describe('Inicio con Google', () => {
  const google = (perfil: PerfilGoogle): ProveedorGoogle => ({ configurado: () => true, urlAutorizacion: () => '', perfil: async () => perfil });
  const pkce = { codigo: 'codigo-de-google', verificadorPkce: 'v'.repeat(43) };

  it('crea la cuenta verificada, y la siguiente vez entra a la misma', async () => {
    const { repo, sesion } = entorno();
    const terminar = new TerminarGoogle(repo, google({ sub: 'g-1', email: 'Lu@Gmail.com', emailVerificado: true, nombre: 'Lu' }));
    const id = await sesion.ejecutar(await terminar.ejecutar(pkce));
    const cuenta = await repo.porId(id!);
    expect(cuenta).toMatchObject({ email: 'lu@gmail.com', emailVerificado: true, conGoogle: true, tieneContrasena: false });
    expect(await sesion.ejecutar(await terminar.ejecutar(pkce))).toBe(id);
  });

  it('si otra persona creó la cuenta con el correo de la dueña, al entrar ella con Google pierde todo acceso', async () => {
    const { repo, registrar, entrar, sesion } = entorno();
    const tokenIntruso = await registrar.ejecutar(datos({ email: 'victima@gmail.com', nombre: 'Intruso', telefono: '3119998877' }));
    const id = (await sesion.ejecutar(tokenIntruso))!;
    await new AgregarDireccion(repo).ejecutar(id, { departamento: 'Antioquia', ciudad: 'Medellín', direccion: 'Dirección del intruso 1' });

    const tokenDuena = await new TerminarGoogle(repo, google({ sub: 'g-9', email: 'victima@gmail.com', emailVerificado: true, nombre: 'Dueña Real' })).ejecutar(pkce);
    expect(await sesion.ejecutar(tokenDuena)).toBe(id);
    expect(await sesion.ejecutar(tokenIntruso)).toBeNull();
    await expect(entrar.ejecutar({ email: 'victima@gmail.com', contrasena: 'una-clave-larga-1' })).rejects.toThrow(CredencialesInvalidas);
    expect(await repo.porId(id)).toMatchObject({ nombre: 'Dueña Real', telefono: null, tieneContrasena: false, emailVerificado: true });
    expect(await repo.direcciones(id)).toEqual([]);
  });

  it('une la cuenta existente con el mismo correo y rechaza correos sin confirmar', async () => {
    const { repo, correo, registrar, sesion } = entorno();
    const id = await sesion.ejecutar(await registrar.ejecutar(datos({ email: 'mia@gmail.com' })));
    await new VerificarEmail(repo).ejecutar(id!, { token: correo.ultimoToken() }); // la dueña ya había confirmado su correo
    const unida = await new TerminarGoogle(repo, google({ sub: 'g-2', email: 'mia@gmail.com', emailVerificado: true, nombre: 'Mía' })).ejecutar(pkce);
    expect(await sesion.ejecutar(unida)).toBe(id);
    expect(await repo.porId(id!)).toMatchObject({ conGoogle: true, emailVerificado: true, tieneContrasena: true });
    await expect(
      new TerminarGoogle(repo, google({ sub: 'g-3', email: 'x@gmail.com', emailVerificado: false, nombre: 'X' })).ejecutar(pkce),
    ).rejects.toThrow(DatosInvalidos);
  });
});
