import { createHash, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

// Contraseñas con scrypt (incluido en Node): sal aleatoria por contraseña y costo guardado junto al hash,
// para poder subirlo más adelante sin invalidar las existentes.
const COSTO = { N: 2 ** 15, r: 8, p: 1 };
const LARGO = 64;
const MEMORIA = 64 * 1024 * 1024;

function derivar(contrasena: string, sal: Buffer, opciones: ScryptOptions) {
  return new Promise<Buffer>((ok, mal) =>
    scrypt(contrasena.normalize('NFKC'), sal, LARGO, { ...opciones, maxmem: MEMORIA }, (e, clave) => (e ? mal(e) : ok(clave))),
  );
}

export async function hashContrasena(contrasena: string) {
  const sal = randomBytes(16);
  const clave = await derivar(contrasena, sal, COSTO);
  return `scrypt$${COSTO.N}$${COSTO.r}$${COSTO.p}$${sal.toString('base64')}$${clave.toString('base64')}`;
}

export async function verificarContrasena(contrasena: string, guardado: string) {
  const [alg, N, r, p, sal, clave] = guardado.split('$');
  if (alg !== 'scrypt' || !sal || !clave) return false;
  const esperado = Buffer.from(clave, 'base64');
  const calculado = await derivar(contrasena, Buffer.from(sal, 'base64'), { N: Number(N), r: Number(r), p: Number(p) });
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

// Hash de una contraseña que no existe: si el correo no tiene cuenta se verifica igual contra este,
// así la respuesta tarda lo mismo y no revela qué correos están registrados.
let hashFalso: Promise<string> | undefined;
export const contrasenaFalsa = () => (hashFalso ??= hashContrasena(randomBytes(16).toString('hex')));

/** Token para la cookie o un enlace por correo. En la base solo se guarda su hash. */
export const nuevoToken = () => randomBytes(32).toString('base64url');
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
