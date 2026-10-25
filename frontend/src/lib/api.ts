import { cacheLife, cacheTag } from "next/cache";
import { tonos, type Producto } from "./data";

// Solo se usa en el servidor: la URL del API no se expone al navegador.
export const API_URL = process.env.API_URL ?? "http://localhost:4000/api";
export const TAG_PRODUCTOS = "productos";

/** Errores de validación que devuelve el API (`{ errores: [...] }`) o un mensaje por defecto. */
export async function erroresDe(r: Response, porDefecto: string): Promise<string[]> {
  const cuerpo = await r.json().catch(() => ({}));
  return Array.isArray(cuerpo.errores) ? cuerpo.errores : [porDefecto];
}

export type ProductoApi = Omit<Producto, "precioAntes" | "tono" | "opciones"> & {
  id: string;
  precioAntes: number | null;
  activo: boolean;
  stockTotal: number;
};

function aTienda(p: ProductoApi): Producto {
  // Las opciones (Talla, Color...) se deducen de las variantes, en el orden en que aparecen.
  const opciones: Producto["opciones"] = [];
  for (const v of p.variantes) {
    for (const [nombre, valor] of Object.entries(v.opciones)) {
      let op = opciones.find((o) => o.nombre === nombre);
      if (!op) opciones.push((op = { nombre, valores: [] }));
      if (!op.valores.includes(valor)) op.valores.push(valor);
    }
  }
  const hash = [...p.slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  return {
    slug: p.slug,
    nombre: p.nombre,
    categoria: p.categoria,
    precio: p.precio,
    precioAntes: p.precioAntes ?? undefined,
    descripcion: p.descripcion,
    nuevo: p.nuevo,
    atributos: p.atributos,
    imagenes: p.imagenes,
    tono: tonos[hash % tonos.length],
    opciones,
    variantes: p.variantes,
  };
}

async function pedir(ruta: string) {
  const r = await fetch(`${API_URL}${ruta}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`El API respondió ${r.status} en ${ruta}`);
  return r.json();
}

export async function obtenerProductos(): Promise<Producto[]> {
  "use cache";
  cacheTag(TAG_PRODUCTOS);
  cacheLife("minutes");
  return ((await pedir("/productos")) as ProductoApi[]).map(aTienda);
}

export async function obtenerProducto(slug: string): Promise<Producto | null> {
  "use cache";
  cacheTag(TAG_PRODUCTOS);
  cacheLife("minutes");
  const p = (await pedir(`/productos/${encodeURIComponent(slug)}`)) as ProductoApi | null;
  return p && aTienda(p);
}
