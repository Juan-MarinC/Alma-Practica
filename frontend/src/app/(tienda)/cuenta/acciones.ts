"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { erroresDe } from "@/lib/api";
import { abrirSesionCliente, apiCuenta, cerrarSesionCliente, rutaSegura } from "@/lib/cuenta";
import { excedeLimite, ipCliente, MINUTO } from "@/lib/limite";

export type EstadoCuenta = { errores: string[]; ok?: string };

const texto = (f: FormData, k: string) => String(f.get(k) ?? "");
const MUCHOS = { errores: ["Demasiados intentos. Espera unos minutos e intenta de nuevo."] };
const limite = async (accion: string, max: number, ventana: number) => excedeLimite(`${accion}:${await ipCliente()}`, max, ventana);

/** Si la sesión venció mientras la clienta tenía la página abierta, la manda a entrar. */
function sinSesion(r: Response) {
  if (r.status === 401) redirect("/cuenta/entrar");
}

export async function entrar(_: EstadoCuenta, f: FormData): Promise<EstadoCuenta> {
  if (await limite("cuenta-entrar", 20, 15 * MINUTO)) return MUCHOS;
  const r = await apiCuenta("/sesion", "POST", { email: texto(f, "email"), contrasena: texto(f, "contrasena") });
  if (!r.ok) return { errores: await erroresDe(r, "No pudimos iniciar sesión. Intenta de nuevo.") };
  await abrirSesionCliente((await r.json()).token);
  redirect(rutaSegura(f.get("volver")));
}

export async function registrar(_: EstadoCuenta, f: FormData): Promise<EstadoCuenta> {
  if (await limite("cuenta-registro", 10, 60 * MINUTO)) return MUCHOS;
  if (texto(f, "contrasena") !== texto(f, "confirmar")) return { errores: ["Las contraseñas no coinciden"] };
  const r = await apiCuenta("/registro", "POST", {
    nombre: texto(f, "nombre"),
    email: texto(f, "email"),
    telefono: texto(f, "telefono"),
    contrasena: texto(f, "contrasena"),
    aceptaDatos: f.get("aceptaDatos") === "on",
  });
  if (!r.ok) return { errores: await erroresDe(r, "No pudimos crear tu cuenta. Intenta de nuevo.") };
  await abrirSesionCliente((await r.json()).token);
  redirect(rutaSegura(f.get("volver")));
}

export async function salir() {
  await apiCuenta("/sesion", "DELETE");
  await cerrarSesionCliente();
  redirect("/");
}

export async function recuperar(_: EstadoCuenta, f: FormData): Promise<EstadoCuenta> {
  if (await limite("cuenta-recuperar", 10, 60 * MINUTO)) return MUCHOS;
  await apiCuenta("/contrasena/olvido", "POST", { email: texto(f, "email") });
  // Mismo mensaje exista o no la cuenta: no se revela qué correos están registrados.
  return { errores: [], ok: "Si ese correo tiene una cuenta, te enviamos un enlace para crear una contraseña nueva. Revisa también la carpeta de spam." };
}

export async function restablecer(_: EstadoCuenta, f: FormData): Promise<EstadoCuenta> {
  if (await limite("cuenta-restablecer", 20, 15 * MINUTO)) return MUCHOS;
  if (texto(f, "contrasena") !== texto(f, "confirmar")) return { errores: ["Las contraseñas no coinciden"] };
  const r = await apiCuenta("/contrasena/restablecer", "POST", { token: texto(f, "token"), contrasena: texto(f, "contrasena") });
  if (!r.ok) return { errores: await erroresDe(r, "No pudimos cambiar tu contraseña. Intenta de nuevo.") };
  await cerrarSesionCliente();
  redirect("/cuenta/entrar?listo=contrasena");
}

export async function actualizarPerfil(_: EstadoCuenta, f: FormData): Promise<EstadoCuenta> {
  const r = await apiCuenta("/yo", "PATCH", { nombre: texto(f, "nombre"), telefono: texto(f, "telefono") });
  sinSesion(r);
  if (!r.ok) return { errores: await erroresDe(r, "No pudimos guardar tus datos.") };
  refresh();
  return { errores: [], ok: "Guardamos tus datos." };
}

export async function cambiarContrasena(_: EstadoCuenta, f: FormData): Promise<EstadoCuenta> {
  if (await limite("cuenta-contrasena", 10, 15 * MINUTO)) return MUCHOS;
  if (texto(f, "nueva") !== texto(f, "confirmar")) return { errores: ["Las contraseñas nuevas no coinciden"] };
  const r = await apiCuenta("/yo/contrasena", "POST", { actual: texto(f, "actual"), nueva: texto(f, "nueva") });
  sinSesion(r);
  if (!r.ok) return { errores: await erroresDe(r, "No pudimos cambiar tu contraseña.") };
  refresh();
  return { errores: [], ok: "Listo. Cerramos tu sesión en los demás dispositivos." };
}

export async function reenviarVerificacion(): Promise<EstadoCuenta> {
  const r = await apiCuenta("/yo/verificacion", "POST");
  sinSesion(r);
  if (!r.ok) return { errores: await erroresDe(r, "No pudimos enviar el correo.") };
  return { errores: [], ok: "Te enviamos el enlace. Revisa tu correo (y la carpeta de spam)." };
}

export async function agregarDireccion(_: EstadoCuenta, f: FormData): Promise<EstadoCuenta> {
  const r = await apiCuenta("/yo/direcciones", "POST", {
    departamento: texto(f, "departamento"),
    ciudad: texto(f, "ciudad"),
    direccion: texto(f, "direccion"),
    indicaciones: texto(f, "indicaciones"),
  });
  sinSesion(r);
  if (!r.ok) return { errores: await erroresDe(r, "No pudimos guardar la dirección.") };
  refresh();
  return { errores: [], ok: "Guardamos la dirección." };
}

export async function borrarDireccion(id: number) {
  if (!Number.isInteger(id) || id < 1) return;
  sinSesion(await apiCuenta(`/yo/direcciones/${id}`, "DELETE"));
  refresh();
}

export async function eliminarCuenta(_: EstadoCuenta, f: FormData): Promise<EstadoCuenta> {
  const r = await apiCuenta("/yo", "DELETE", { confirmacion: texto(f, "confirmacion").trim() });
  sinSesion(r);
  if (!r.ok) return { errores: await erroresDe(r, "No pudimos eliminar tu cuenta.") };
  await cerrarSesionCliente();
  redirect("/cuenta/eliminada");
}
