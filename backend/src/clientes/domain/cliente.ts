// Dominio de cuentas de clientas: reglas y validaciones, sin NestJS ni Postgres.
import { validarEnvio, type Envio } from '../../pedidos/domain/pedido.js';
import { DatosInvalidos, objeto, validarCelular, validarEmail, validarNombre } from '../../shared/validacion.js';

export { DatosInvalidos };
export { normalizarEmail } from '../../shared/validacion.js';

/** Lo que la clienta ve de su cuenta. Nunca incluye el hash de la contraseña. */
export type Cuenta = {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  emailVerificado: boolean;
  tieneContrasena: boolean;
  conGoogle: boolean;
  creadaEn: string;
};

export type ClienteGuardado = Cuenta & { contrasenaHash: string | null };

export type DatosDireccion = Envio;
export type Direccion = DatosDireccion & { id: number };

export type PedidoCliente = { id: string; numero: number; estado: string; total: number; unidades: number; creadoEn: string };

export type ClienteNuevo = {
  nombre: string;
  email: string;
  telefono: string | null;
  contrasenaHash: string | null;
  googleSub: string | null;
  emailVerificado: boolean;
  aceptaDatosEn: string;
};

export type PerfilGoogle = { sub: string; email: string; emailVerificado: boolean; nombre: string };

export class CredencialesInvalidas extends Error {}
export class CorreoEnUso extends Error {}
export class EnlaceInvalido extends Error {}
export class SesionInvalida extends Error {}
export class DemasiadosIntentos extends Error {}
export class GoogleNoConfigurado extends Error {}

const MIN_CONTRASENA = 10;
export const MAX_DIRECCIONES = 10;
export const DURACION_SESION_MS = 30 * 24 * 60 * 60 * 1000;
export const DURACION_ENLACE_MS = { verificar_email: 48 * 60 * 60 * 1000, restablecer_contrasena: 30 * 60 * 1000 };
export type TipoEnlace = keyof typeof DURACION_ENLACE_MS;

// Opcional en la cuenta (el checkout sí lo exige): vacío se guarda como null.
const validarTelefono = (v: unknown, errores: string[]) => validarCelular(v, errores, false) || null;

/** Sin reglas de símbolos raros: el largo es lo que más protege. Las contraseñas no se recortan ni normalizan. */
export function validarContrasena(v: unknown, errores: string[]) {
  const contrasena = typeof v === 'string' ? v : '';
  if (contrasena.length < MIN_CONTRASENA) errores.push(`La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres`);
  else if (contrasena.length > 128) errores.push('La contraseña puede tener máximo 128 caracteres');
  else if (/^(.)\1+$/.test(contrasena) || /^(0123456789|1234567890|contrasena|contraseña|password)/i.test(contrasena))
    errores.push('Esa contraseña es muy fácil de adivinar');
  return contrasena;
}

export function validarRegistro(datos: unknown, ahora: Date) {
  const o = objeto(datos);
  const errores: string[] = [];
  const nombre = validarNombre(o.nombre, errores);
  const email = validarEmail(o.email, errores);
  const telefono = validarTelefono(o.telefono, errores);
  const contrasena = validarContrasena(o.contrasena, errores);
  if (o.aceptaDatos !== true) errores.push('Debes aceptar la política de tratamiento de datos');
  if (errores.length) throw new DatosInvalidos(errores);
  return { nombre, email, telefono, contrasena, aceptaDatosEn: ahora.toISOString() };
}

export function validarPerfil(datos: unknown) {
  const o = objeto(datos);
  const errores: string[] = [];
  const nombre = validarNombre(o.nombre, errores);
  const telefono = validarTelefono(o.telefono, errores);
  if (errores.length) throw new DatosInvalidos(errores);
  return { nombre, telefono };
}

export function validarDireccion(datos: unknown): DatosDireccion {
  const errores: string[] = [];
  const direccion = validarEnvio(datos, errores);
  if (errores.length) throw new DatosInvalidos(errores);
  return direccion;
}

export const aCuenta = ({ contrasenaHash: _hash, ...cuenta }: ClienteGuardado): Cuenta => cuenta;
