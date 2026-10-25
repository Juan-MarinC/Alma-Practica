// Dominio de cuentas de clientas: reglas y validaciones, sin NestJS ni Postgres.
import { DEPARTAMENTOS } from '../../pedidos/domain/pedido.js';

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

export type DatosDireccion = { departamento: string; ciudad: string; direccion: string; indicaciones: string };
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

export class DatosInvalidos extends Error {
  constructor(readonly errores: string[]) {
    super(errores.join('; '));
  }
}
export class CredencialesInvalidas extends Error {}
export class CorreoEnUso extends Error {}
export class EnlaceInvalido extends Error {}
export class SesionInvalida extends Error {}
export class DemasiadosIntentos extends Error {}
export class GoogleNoConfigurado extends Error {}

export const MIN_CONTRASENA = 10;
export const MAX_DIRECCIONES = 10;
export const DURACION_SESION_MS = 30 * 24 * 60 * 60 * 1000;
export const DURACION_ENLACE_MS = { verificar_email: 48 * 60 * 60 * 1000, restablecer_contrasena: 30 * 60 * 1000 };
export type TipoEnlace = keyof typeof DURACION_ENLACE_MS;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const texto = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');
const objeto = (v: unknown) => (esObjeto(v) ? v : {});

export const normalizarEmail = (v: unknown) => texto(v).toLowerCase();

function validarNombre(v: unknown, errores: string[]) {
  const nombre = texto(v);
  if (nombre.length < 3 || nombre.length > 120) errores.push('Escribe tu nombre completo');
  return nombre;
}

// Opcional en la cuenta (el checkout sí lo exige): vacío se guarda como null.
function validarTelefono(v: unknown, errores: string[]) {
  const telefono = texto(v).replace(/[\s()-]/g, '').replace(/^\+?57/, '');
  if (telefono && !/^3\d{9}$/.test(telefono)) errores.push('Escribe un celular colombiano de 10 dígitos');
  return telefono || null;
}

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
  const email = normalizarEmail(o.email);
  if (!EMAIL.test(email) || email.length > 254) errores.push('Revisa tu correo electrónico');
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
  const o = objeto(datos);
  const errores: string[] = [];
  const departamento = texto(o.departamento);
  const ciudad = texto(o.ciudad);
  const direccion = texto(o.direccion);
  const indicaciones = texto(o.indicaciones);
  if (!DEPARTAMENTOS.includes(departamento)) errores.push('Elige un departamento');
  if (ciudad.length < 2 || ciudad.length > 80) errores.push('Escribe la ciudad o municipio');
  if (direccion.length < 5 || direccion.length > 200) errores.push('Escribe la dirección completa');
  if (indicaciones.length > 200) errores.push('Las indicaciones pueden tener máximo 200 caracteres');
  if (errores.length) throw new DatosInvalidos(errores);
  return { departamento, ciudad, direccion, indicaciones };
}

export const aCuenta = ({ contrasenaHash: _hash, ...cuenta }: ClienteGuardado): Cuenta => cuenta;
