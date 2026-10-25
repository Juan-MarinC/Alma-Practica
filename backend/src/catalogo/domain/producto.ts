// Dominio puro: no depende de NestJS, Postgres ni HTTP.
import { DatosInvalidos, esObjeto, objeto } from '../../shared/validacion.js';

export type Variante = {
  sku: string;
  opciones: Record<string, string>;
  precio: number;
  stock: number;
};

export type Producto = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  precioAntes: number | null;
  nuevo: boolean;
  activo: boolean;
  atributos: Record<string, unknown>;
  imagenes: string[];
  variantes: Variante[];
};

// Datos para crear o editar un producto. `precio: null` en la variante = usa el precio del producto.
// `stockAnterior` = stock que vio el panel al abrir el formulario; si cambió (hubo una venta) no se pisa.
export type VarianteEntrada = Omit<Variante, 'precio'> & { precio: number | null; stockAnterior: number | null };
export type ProductoEntrada = Omit<Producto, 'id' | 'variantes'> & { variantes: VarianteEntrada[] };

export function stockTotal(producto: Producto): number {
  return producto.variantes.reduce((total, v) => total + v.stock, 0);
}

export function estaDisponible(producto: Producto): boolean {
  return producto.activo && stockTotal(producto) > 0;
}

export class ProductoNoEncontrado extends Error {
  constructor(slug: string) {
    super(`No existe el producto "${slug}"`);
  }
}

export { DatosInvalidos };

export class ConflictoProducto extends Error {}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKU = /^[A-Za-z0-9._-]{1,64}$/;
const PRECIO_MAX = 100_000_000;
const STOCK_MAX = 1_000_000;

const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const entero = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

// URL https externa o archivo propio de la tienda (frontend/public), ej. /productos/blusa.svg
const RUTA_LOCAL = /^\/[a-z0-9][a-z0-9/_-]*\.(svg|png|jpe?g|webp|avif)$/i;

function esUrlImagen(v: unknown) {
  if (typeof v !== 'string' || v.length > 500) return false;
  if (RUTA_LOCAL.test(v) && !v.includes('..')) return true;
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
}

// Valida los datos que llegan del panel de administración y los normaliza.
export function validarProducto(datos: unknown): ProductoEntrada {
  const o = objeto(datos);
  const errores: string[] = [];

  const slug = texto(o.slug);
  const nombre = texto(o.nombre);
  const descripcion = texto(o.descripcion);
  const categoria = texto(o.categoria);
  if (!SLUG.test(slug) || slug.length > 120) errores.push('Slug: solo minúsculas, números y guiones');
  if (!nombre || nombre.length > 160) errores.push('Nombre: obligatorio, máximo 160 caracteres');
  if (descripcion.length > 5000) errores.push('Descripción: máximo 5000 caracteres');
  if (!categoria) errores.push('Categoría: obligatoria');
  if (!entero(o.precio, 1, PRECIO_MAX)) errores.push('Precio: entero en pesos, mayor que 0');
  const precioAntes = o.precioAntes ?? null;
  if (precioAntes !== null && !(entero(precioAntes, 1, PRECIO_MAX) && precioAntes > (o.precio as number)))
    errores.push('Precio antes: debe ser mayor que el precio');

  const atributos = o.atributos ?? {};
  if (!esObjeto(atributos) || JSON.stringify(atributos).length > 5000)
    errores.push('Atributos: máximo 5000 caracteres');

  const imagenes = o.imagenes ?? [];
  if (!Array.isArray(imagenes) || imagenes.length > 10 || !imagenes.every(esUrlImagen))
    errores.push('Imágenes: hasta 10 URLs https:// o rutas de la tienda como /productos/foto.jpg');

  const crudas = Array.isArray(o.variantes) ? o.variantes : [];
  if (crudas.length === 0 || crudas.length > 200) errores.push('Variantes: entre 1 y 200');
  const skus = new Set<string>();
  const variantes = crudas.map((cruda, i): VarianteEntrada => {
    const v = objeto(cruda);
    const sku = texto(v.sku);
    if (!SKU.test(sku)) errores.push(`Variante ${i + 1}: SKU inválido (letras, números, . _ -)`);
    else if (skus.has(sku)) errores.push(`Variante ${i + 1}: SKU repetido "${sku}"`);
    skus.add(sku);
    const opciones = v.opciones ?? {};
    if (!esObjeto(opciones) || !Object.values(opciones).every((x) => typeof x === 'string' && x.trim()))
      errores.push(`Variante ${i + 1}: las opciones deben ser textos, ej. Talla=M`);
    const precio = v.precio ?? null;
    if (precio !== null && !entero(precio, 1, PRECIO_MAX)) errores.push(`Variante ${i + 1}: precio inválido`);
    if (!entero(v.stock, 0, STOCK_MAX)) errores.push(`Variante ${i + 1}: el stock debe ser un entero desde 0`);
    const stockAnterior = v.stockAnterior ?? null;
    if (stockAnterior !== null && !entero(stockAnterior, 0, STOCK_MAX)) errores.push(`Variante ${i + 1}: stock anterior inválido`);
    return {
      sku,
      opciones: opciones as Record<string, string>,
      precio: precio as number | null,
      stock: v.stock as number,
      stockAnterior: stockAnterior as number | null,
    };
  });

  if (errores.length) throw new DatosInvalidos(errores);
  return {
    slug,
    nombre,
    descripcion,
    categoria,
    precio: o.precio as number,
    precioAntes: precioAntes as number | null,
    nuevo: o.nuevo === true,
    activo: o.activo !== false,
    atributos: atributos as Record<string, unknown>,
    imagenes: imagenes as string[],
    variantes,
  };
}
