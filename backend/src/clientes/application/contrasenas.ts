import { Inject, Injectable } from '@nestjs/common';
import { CORREO, type Correo } from '../../shared/correo/correo.js';
import { MINUTO, olvidarIntentos, sumarIntento } from '../../shared/limite.js';
import {
  DatosInvalidos,
  DemasiadosIntentos,
  EnlaceInvalido,
  normalizarEmail,
  SesionInvalida,
  validarContrasena,
} from '../domain/cliente.js';
import { REPOSITORIO_CLIENTES, type RepositorioClientes } from '../domain/repositorio-clientes.js';
import { hashContrasena, hashToken, verificarContrasena } from '../domain/secretos.js';
import { enviarEnlace } from './comun.js';

const objeto = (v: unknown) => (typeof v === 'object' && v !== null ? v : {}) as Record<string, unknown>;
const tokenDe = (v: unknown) => (typeof v === 'string' && /^[A-Za-z0-9_-]{20,100}$/.test(v) ? v : null);

@Injectable()
export class CambiarContrasena {
  constructor(@Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes) {}

  /** Pide la actual si la cuenta ya tiene contraseña (quien solo entra con Google puede crear una). Cierra las otras sesiones. */
  async ejecutar(clienteId: string, tokenSesion: string, datos: unknown) {
    const o = objeto(datos);
    const errores: string[] = [];
    const nueva = validarContrasena(o.nueva, errores);
    if (errores.length) throw new DatosInvalidos(errores);
    const cliente = await this.repo.porId(clienteId);
    if (!cliente) throw new SesionInvalida();
    if (cliente.contrasenaHash) {
      const actual = typeof o.actual === 'string' ? o.actual : '';
      // Error de datos y no de credenciales: la sesión sigue siendo válida (un 401 la mandaría a iniciar sesión).
      if (!actual || !(await verificarContrasena(actual, cliente.contrasenaHash)))
        throw new DatosInvalidos(['Tu contraseña actual no es correcta']);
    }
    await this.repo.cambiarContrasena(clienteId, await hashContrasena(nueva));
    await this.repo.cerrarSesiones(clienteId, hashToken(tokenSesion));
  }
}

@Injectable()
export class SolicitarRestablecer {
  constructor(
    @Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes,
    @Inject(CORREO) private readonly correo: Correo,
  ) {}

  /** Siempre responde igual, exista o no la cuenta, para no revelar qué correos están registrados. */
  async ejecutar(datos: unknown) {
    const email = normalizarEmail(objeto(datos).email);
    if (!email || email.length > 254) return;
    // Máximo 3 correos por hora por cuenta: evita usar la tienda para llenar el buzón de alguien.
    if (sumarIntento(`restablecer:${email}`, 60 * MINUTO) > 3) return;
    const cliente = await this.repo.porEmail(email);
    if (cliente) await enviarEnlace(this.repo, this.correo, cliente, 'restablecer_contrasena');
  }
}

@Injectable()
export class RestablecerContrasena {
  constructor(@Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes) {}

  /** El enlace prueba que el correo es suyo: queda verificado y se cierran todas sus sesiones. */
  async ejecutar(datos: unknown) {
    const o = objeto(datos);
    const errores: string[] = [];
    const contrasena = validarContrasena(o.contrasena, errores);
    if (errores.length) throw new DatosInvalidos(errores);
    const token = tokenDe(o.token);
    const clienteId = token && (await this.repo.usarEnlace(hashToken(token), 'restablecer_contrasena'));
    if (!clienteId) throw new EnlaceInvalido();
    // Igual que al unir con Google: si el correo no estaba confirmado, se limpia lo que pudo dejar quien creó la cuenta.
    const cliente = await this.repo.porId(clienteId);
    if (cliente && !cliente.emailVerificado) await this.repo.reiniciarNoVerificada(clienteId, cliente.nombre);
    await this.repo.cambiarContrasena(clienteId, await hashContrasena(contrasena));
    await this.repo.marcarEmailVerificado(clienteId);
    await this.repo.cerrarSesiones(clienteId);
    // Quien bloqueó la cuenta fallando contraseñas a propósito no le impide entrar con la nueva.
    if (cliente) olvidarIntentos(`login:${cliente.email}`);
  }
}

@Injectable()
export class VerificarEmail {
  constructor(@Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes) {}

  /**
   * Solo con la sesión de la misma cuenta: si alguien creó la cuenta con un correo ajeno, que la dueña (o el
   * antivirus de su correo) abra el enlace no le confirma esa cuenta a quien la creó.
   */
  async ejecutar(clienteId: string, datos: unknown) {
    const token = tokenDe(objeto(datos).token);
    if (!token || !(await this.repo.usarEnlace(hashToken(token), 'verificar_email', clienteId))) throw new EnlaceInvalido();
    await this.repo.marcarEmailVerificado(clienteId);
  }
}

@Injectable()
export class ReenviarVerificacion {
  constructor(
    @Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes,
    @Inject(CORREO) private readonly correo: Correo,
  ) {}

  async ejecutar(clienteId: string) {
    const cliente = await this.repo.porId(clienteId);
    if (!cliente) throw new SesionInvalida();
    if (cliente.emailVerificado) return;
    if (sumarIntento(`verificacion:${clienteId}`, 60 * MINUTO) > 3) throw new DemasiadosIntentos();
    await enviarEnlace(this.repo, this.correo, cliente, 'verificar_email');
  }
}
