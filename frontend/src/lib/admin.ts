import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { API_URL, erroresDe, type ProductoApi } from "./api";

// Solo para código de servidor (páginas y acciones de /admin): usa secretos del entorno.
const COOKIE = "alma_admin";
const DURACION = 8 * 60 * 60; // segundos

function token() {
  const t = process.env.ADMIN_TOKEN ?? "";
  if (t.length < 32) throw new Error("Configura ADMIN_TOKEN (mínimo 32 caracteres) en frontend/.env.local");
  return t;
}

const firmar = (exp: number) => createHmac("sha256", token()).update(`admin:${exp}`).digest("base64url");
const digerir = (s: string) => createHash("sha256").update(s).digest();
const iguales = (a: string, b: string) => timingSafeEqual(digerir(a), digerir(b));

async function haySesion() {
  await connection(); // usa la hora actual: siempre se evalúa en la petición, nunca al prerenderizar
  const [exp, firma] = ((await cookies()).get(COOKIE)?.value ?? "").split(".");
  return !!exp && !!firma && Number(exp) > Date.now() / 1000 && iguales(firma, firmar(Number(exp)));
}

export async function exigirAdmin() {
  if (!(await haySesion())) redirect("/admin/login");
}

export async function abrirSesion(clave: string) {
  const esperada = process.env.ADMIN_CLAVE ?? "";
  if (esperada.length < 12 || !iguales(clave, esperada)) return false;
  const exp = Math.floor(Date.now() / 1000) + DURACION;
  (await cookies()).set(COOKIE, `${exp}.${firmar(exp)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: DURACION,
  });
  return true;
}

export async function cerrarSesion() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}

function llamarApi(ruta: string, init?: RequestInit) {
  return fetch(`${API_URL}/admin${ruta}`, {
    ...init,
    cache: "no-store",
    headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
  });
}

export async function listarProductosAdmin() {
  return leerJson<ProductoApi[]>(await llamarApi("/productos"));
}

/** Crea (sin slugActual) o edita un producto. Devuelve los errores para mostrarlos en el formulario. */
export async function enviarProducto(datos: unknown, slugActual: string | null): Promise<string[]> {
  const r = await llamarApi(slugActual ? `/productos/${encodeURIComponent(slugActual)}` : "/productos", {
    method: slugActual ? "PUT" : "POST",
    body: JSON.stringify(datos),
  });
  return r.ok ? [] : erroresDe(r, r.status === 401 ? "El backend rechazó ADMIN_TOKEN" : `Error inesperado del API (${r.status})`);
}

export type EstadoPedido = "pendiente_pago" | "pagado" | "preparando" | "enviado" | "entregado" | "cancelado";

export type FilaPedido = {
  id: string;
  numero: number;
  estado: EstadoPedido;
  total: number;
  creadoEn: string;
  cliente: string;
  ciudad: string;
  pagoEstado: string | null;
};

export type PedidoAdmin = {
  id: string;
  numero: number;
  estado: EstadoPedido;
  lineas: { nombre: string; opciones: Record<string, string>; cantidad: number; precioUnitario: number }[];
  subtotal: number;
  costoEnvio: number;
  total: number;
  guiaEnvio: string | null;
  creadoEn: string;
  contacto: { nombre: string; email: string; telefono: string; aceptaDatosEn: string };
  envio: { departamento: string; ciudad: string; direccion: string; indicaciones: string };
  pago: { referencia: string; estado: string; metodo: string | null } | null;
};

async function leerJson<T>(r: Response): Promise<T> {
  if (r.status === 401) throw new Error("El backend rechazó ADMIN_TOKEN: debe ser igual en backend/.env y frontend/.env.local");
  if (!r.ok) throw new Error(`El API respondió ${r.status}`);
  return r.json();
}

export async function listarPedidosAdmin() {
  return leerJson<FilaPedido[]>(await llamarApi("/pedidos"));
}

export async function obtenerPedidoAdmin(id: string): Promise<PedidoAdmin | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const r = await llamarApi(`/pedidos/${id}`);
  return r.status === 404 ? null : leerJson<PedidoAdmin>(r);
}

export async function actualizarPedido(id: string, cambio: { estado: string; guiaEnvio: string }): Promise<string[]> {
  const r = await llamarApi(`/pedidos/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(cambio) });
  return r.ok ? [] : erroresDe(r, `Error inesperado del API (${r.status})`);
}
