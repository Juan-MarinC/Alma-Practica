// Validación de entrada común a los dominios: funciones puras, sin NestJS ni Postgres.

export class DatosInvalidos extends Error {
  constructor(readonly errores: string[]) {
    super(errores.join('; '));
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export const objeto = (v: unknown): Record<string, unknown> => (esObjeto(v) ? v : {});
/** Recorta y deja un solo espacio entre palabras. */
export const texto = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');
export const normalizarEmail = (v: unknown) => texto(v).toLowerCase();

export function validarNombre(v: unknown, errores: string[]) {
  const nombre = texto(v);
  if (nombre.length < 3 || nombre.length > 120) errores.push('Escribe tu nombre completo');
  return nombre;
}

export function validarEmail(v: unknown, errores: string[]) {
  const email = normalizarEmail(v);
  if (!EMAIL.test(email) || email.length > 254) errores.push('Revisa tu correo electrónico');
  return email;
}

/** Celular colombiano sin espacios ni +57. Si no es obligatorio, vacío devuelve ''. */
export function validarCelular(v: unknown, errores: string[], obligatorio: boolean) {
  const telefono = texto(v).replace(/[\s()-]/g, '').replace(/^\+?57/, '');
  if ((obligatorio || telefono) && !/^3\d{9}$/.test(telefono)) errores.push('Escribe un celular colombiano de 10 dígitos');
  return telefono;
}
