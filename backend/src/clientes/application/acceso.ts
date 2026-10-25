import { Inject, Injectable } from '@nestjs/common';
import { CORREO, type Correo } from '../../shared/correo/correo.js';
import { intentos, MINUTO, olvidarIntentos, sumarIntento } from '../../shared/limite.js';
import {
  CredencialesInvalidas,
  DatosInvalidos,
  DemasiadosIntentos,
  GoogleNoConfigurado,
  normalizarEmail,
  validarRegistro,
} from '../domain/cliente.js';
import { PROVEEDOR_GOOGLE, type ProveedorGoogle } from '../domain/proveedor-google.js';
import { REPOSITORIO_CLIENTES, type RepositorioClientes } from '../domain/repositorio-clientes.js';
import { contrasenaFalsa, hashContrasena, hashToken, verificarContrasena } from '../domain/secretos.js';
import { abrirSesion, enviarEnlace } from './comun.js';

const MAX_FALLOS_POR_CORREO = 10;

@Injectable()
export class RegistrarCliente {
  constructor(
    @Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes,
    @Inject(CORREO) private readonly correo: Correo,
  ) {}

  /** Crea la cuenta, envía el correo de confirmación y deja la sesión abierta. Devuelve el token de la sesión. */
  async ejecutar(datos: unknown) {
    const r = validarRegistro(datos, new Date());
    const id = await this.repo.crear({
      nombre: r.nombre,
      email: r.email,
      telefono: r.telefono,
      contrasenaHash: await hashContrasena(r.contrasena),
      googleSub: null,
      emailVerificado: false,
      aceptaDatosEn: r.aceptaDatosEn,
    });
    await enviarEnlace(this.repo, this.correo, { id, nombre: r.nombre, email: r.email }, 'verificar_email');
    return abrirSesion(this.repo, id);
  }
}

@Injectable()
export class IniciarSesion {
  constructor(@Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes) {}

  /** Mismo error y mismo tiempo de respuesta si el correo no existe o la contraseña no coincide. */
  async ejecutar(datos: unknown) {
    const o = (typeof datos === 'object' && datos !== null ? datos : {}) as Record<string, unknown>;
    const email = normalizarEmail(o.email);
    const contrasena = typeof o.contrasena === 'string' ? o.contrasena : '';
    if (!email || !contrasena || contrasena.length > 128) throw new DatosInvalidos(['Escribe tu correo y tu contraseña']);

    // Por correo y no por IP: así no se puede probar contraseñas contra una cuenta repartiendo los intentos.
    const clave = `login:${email}`;
    if (intentos(clave) >= MAX_FALLOS_POR_CORREO) throw new DemasiadosIntentos();
    const cliente = await this.repo.porEmail(email);
    const valida = await verificarContrasena(contrasena, cliente?.contrasenaHash ?? (await contrasenaFalsa()));
    if (!cliente || !cliente.contrasenaHash || !valida) {
      sumarIntento(clave, 15 * MINUTO);
      throw new CredencialesInvalidas();
    }
    olvidarIntentos(clave);
    return abrirSesion(this.repo, cliente.id);
  }
}

@Injectable()
export class CerrarSesion {
  constructor(@Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes) {}

  ejecutar(token: string) {
    return this.repo.cerrarSesion(hashToken(token));
  }
}

/** Traduce el token de la cookie a la clienta. Lo usan el guard de la cuenta y el checkout (pedidos). */
@Injectable()
export class ResolverSesion {
  constructor(@Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes) {}

  ejecutar(token: string | null | undefined) {
    if (!token || token.length > 100) return Promise.resolve(null);
    return this.repo.clienteDeSesion(hashToken(token));
  }
}

const BASE64URL = /^[A-Za-z0-9_-]{32,128}$/;

@Injectable()
export class IniciarGoogle {
  constructor(@Inject(PROVEEDOR_GOOGLE) private readonly google: ProveedorGoogle) {}

  ejecutar(datos: unknown) {
    if (!this.google.configurado()) throw new GoogleNoConfigurado();
    const o = (typeof datos === 'object' && datos !== null ? datos : {}) as Record<string, unknown>;
    if (typeof o.estado !== 'string' || !BASE64URL.test(o.estado) || typeof o.retoPkce !== 'string' || !BASE64URL.test(o.retoPkce))
      throw new DatosInvalidos(['Solicitud de inicio con Google inválida']);
    return this.google.urlAutorizacion(o.estado, o.retoPkce);
  }
}

@Injectable()
export class TerminarGoogle {
  constructor(
    @Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes,
    @Inject(PROVEEDOR_GOOGLE) private readonly google: ProveedorGoogle,
  ) {}

  /**
   * Entra con la cuenta de Google ya vinculada; si no, une la cuenta que tenga ese correo (Google confirma que es suyo)
   * o crea una nueva. Devuelve el token de la sesión.
   */
  async ejecutar(datos: unknown) {
    if (!this.google.configurado()) throw new GoogleNoConfigurado();
    const o = (typeof datos === 'object' && datos !== null ? datos : {}) as Record<string, unknown>;
    if (typeof o.codigo !== 'string' || o.codigo.length > 512 || typeof o.verificadorPkce !== 'string' || !BASE64URL.test(o.verificadorPkce))
      throw new DatosInvalidos(['Respuesta de Google inválida']);

    const perfil = await this.google.perfil(o.codigo, o.verificadorPkce);
    if (!perfil.emailVerificado) throw new DatosInvalidos(['Tu cuenta de Google no tiene el correo confirmado']);

    const conGoogle = await this.repo.porGoogle(perfil.sub);
    if (conGoogle) return abrirSesion(this.repo, conGoogle.id);

    const email = normalizarEmail(perfil.email);
    const nombre = perfil.nombre.trim().slice(0, 120) || email.split('@')[0];
    const existente = await this.repo.porEmail(email);
    if (existente) {
      // Si nadie había confirmado ese correo, la cuenta pudo crearla otra persona con el correo de la dueña:
      // Google prueba quién es la dueña, así que se quita lo que haya dejado el creador (contraseña, sesiones...).
      if (!existente.emailVerificado) await this.repo.reiniciarNoVerificada(existente.id, nombre);
      await this.repo.vincularGoogle(existente.id, perfil.sub);
      return abrirSesion(this.repo, existente.id);
    }
    const id = await this.repo.crear({
      nombre,
      email,
      telefono: null,
      contrasenaHash: null,
      googleSub: perfil.sub,
      emailVerificado: true,
      // La página de entrada informa que continuar con Google acepta la política de datos.
      aceptaDatosEn: new Date().toISOString(),
    });
    return abrirSesion(this.repo, id);
  }
}
