import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_URL } from "./api";

// Sesión de las clientas. Solo para código de servidor: el token vive en una cookie httpOnly y el navegador nunca lo ve.
// La cookie guarda un token al azar; el backend solo tiene su hash y lo puede invalidar (cerrar sesión, cambiar contraseña).
const COOKIE = "alma_sesion";
const DURACION = 30 * 24 * 60 * 60; // segundos, igual que en el backend
/** Cookie temporal (10 min) con `state` y el verificador PKCE mientras la clienta está en Google. */
export const COOKIE_GOOGLE = "alma_google";

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
export type Direccion = { id: number; departamento: string; ciudad: string; direccion: string; indicaciones: string };
export type PedidoCuenta = { id: string; numero: number; estado: string; total: number; unidades: number; creadoEn: string };

export async function tokenCliente() {
  return (await cookies()).get(COOKIE)?.value;
}

/** Llama a /api/clientes con la sesión de la cookie, si hay. */
export async function apiCuenta(ruta: string, metodo = "GET", cuerpo?: unknown) {
  const token = await tokenCliente();
  return fetch(`${API_URL}/clientes${ruta}`, {
    method: metodo,
    cache: "no-store",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
}

export async function abrirSesionCliente(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    // lax y no strict: al volver de Google (otro sitio) la cookie tiene que llegar en la redirección a /cuenta.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION,
  });
}

export async function cerrarSesionCliente() {
  (await cookies()).delete(COOKIE);
}

/** La cuenta de la sesión, o null si no hay sesión o venció. */
export async function obtenerCuenta(): Promise<Cuenta | null> {
  if (!(await tokenCliente())) return null;
  const r = await apiCuenta("/yo");
  if (r.status === 401) return null;
  if (!r.ok) throw new Error(`El API respondió ${r.status} al leer la cuenta`);
  return r.json();
}

export async function exigirCuenta(volver = "/cuenta") {
  const cuenta = await obtenerCuenta();
  if (!cuenta) redirect(`/cuenta/entrar?volver=${encodeURIComponent(volver)}`);
  return cuenta;
}

/** GET de la cuenta que devuelve JSON (pedidos, direcciones). */
export async function leerCuenta<T>(ruta: string): Promise<T> {
  const r = await apiCuenta(ruta);
  if (r.status === 401) redirect("/cuenta/entrar");
  if (!r.ok) throw new Error(`El API respondió ${r.status} en ${ruta}`);
  return r.json();
}

/** Solo rutas internas ("/algo", no "//otro-sitio"): evita que ?volver= mande a la clienta a otra página. */
export function rutaSegura(v: unknown, porDefecto = "/cuenta") {
  return typeof v === "string" && /^\/(?![/\\])[^\s]*$/.test(v) && v.length < 200 ? v : porDefecto;
}

