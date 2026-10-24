"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { TAG_PRODUCTOS } from "@/lib/api";
import { abrirSesion, actualizarPedido, cerrarSesion, enviarProducto, exigirAdmin } from "@/lib/admin";
import { excedeLimite, ipCliente, MINUTO } from "@/lib/limite";

export type EstadoFormulario = { errores: string[] };

export async function iniciarSesion(_: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  // Solo por IP: un tope total dejaría que cualquiera bloquee el panel fallando a propósito.
  // Con ADMIN_CLAVE de 12+ caracteres, 10 intentos por IP cada 15 min hacen inviable adivinarla.
  if (excedeLimite(`login:${await ipCliente()}`, 10, 15 * MINUTO)) {
    return { errores: ["Demasiados intentos. Espera unos minutos e intenta de nuevo."] };
  }
  if (await abrirSesion(String(datos.get("clave") ?? ""))) redirect("/admin");
  await new Promise((r) => setTimeout(r, 1000)); // frena intentos repetidos de adivinar la clave
  return { errores: ["Clave incorrecta"] };
}

export async function salir() {
  await cerrarSesion();
  redirect("/admin/login");
}

// "129.900" o "$129900" -> 129900. Si no es un número se envía tal cual para que el backend lo rechace.
function numero(v: FormDataEntryValue | null) {
  const t = String(v ?? "").replace(/[$.\s]/g, "");
  if (t === "") return null;
  const n = Number(t);
  return Number.isNaN(n) ? t : n;
}

// "Talla=M, Color=Negro" -> { Talla: "M", Color: "Negro" }
function opciones(v: string) {
  return Object.fromEntries(
    v.split(",").map((s) => s.trim()).filter(Boolean).map((par) => {
      const i = par.indexOf("=");
      return i < 0 ? [par, ""] : [par.slice(0, i).trim(), par.slice(i + 1).trim()];
    }),
  );
}

// Una línea por atributo: "material: Seda". "sí"/"no" se guardan como verdadero/falso.
function atributos(v: string) {
  return Object.fromEntries(
    v.split("\n").map((l) => l.trim()).filter(Boolean).map((linea) => {
      const i = linea.indexOf(":");
      const clave = (i < 0 ? linea : linea.slice(0, i)).trim();
      const valor = i < 0 ? "" : linea.slice(i + 1).trim();
      return [clave, valor.toLowerCase() === "sí" ? true : valor.toLowerCase() === "no" ? false : valor];
    }),
  );
}

export async function guardarProducto(slugActual: string | null, _: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  await exigirAdmin(); // cada acción se autoriza sola: no basta con que la página esté protegida
  const texto = (k: string) => String(f.get(k) ?? "");
  const precios = f.getAll("precioVariante");
  const stocks = f.getAll("stock");
  const opcionesVariantes = f.getAll("opciones");
  const stocksAnteriores = f.getAll("stockAnterior");
  const errores = await enviarProducto(
    {
      slug: texto("slug"),
      nombre: texto("nombre"),
      descripcion: texto("descripcion"),
      categoria: texto("categoria"),
      precio: numero(f.get("precio")),
      precioAntes: numero(f.get("precioAntes")),
      nuevo: f.get("nuevo") === "on",
      activo: f.get("activo") === "on",
      atributos: atributos(texto("atributos")),
      imagenes: texto("imagenes").split("\n").map((l) => l.trim()).filter(Boolean),
      variantes: f.getAll("sku").map((sku, i) => ({
        sku: String(sku),
        opciones: opciones(String(opcionesVariantes[i] ?? "")),
        precio: numero(precios[i] ?? null),
        stock: numero(stocks[i] ?? null) ?? 0,
        stockAnterior: numero(stocksAnteriores[i] ?? null),
      })),
    },
    slugActual,
  );
  if (errores.length) return { errores };
  updateTag(TAG_PRODUCTOS);
  redirect("/admin");
}

export async function cambiarEstadoPedido(id: string, _: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  await exigirAdmin();
  const errores = await actualizarPedido(id, { estado: String(f.get("estado") ?? ""), guiaEnvio: String(f.get("guiaEnvio") ?? "") });
  if (errores.length) return { errores };
  updateTag(TAG_PRODUCTOS); // cancelar un pedido pagado devuelve stock
  return { errores: [] };
}
