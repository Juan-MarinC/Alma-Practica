// Tipos de la tienda y datos de presentación (categorías y tonos). Los productos vienen del API: ver lib/api.ts.
export type Categoria = {
  slug: string;
  nombre: string;
  descripcion: string;
  icono: "ropa" | "maquillaje" | "accesorios" | "varios";
  tono: [string, string];
};

export type Variante = {
  sku: string;
  opciones: Record<string, string>;
  precio: number;
  stock: number;
};

export type Producto = {
  slug: string;
  nombre: string;
  categoria: Categoria["slug"];
  precio: number;
  precioAntes?: number;
  descripcion: string;
  nuevo?: boolean;
  atributos: Record<string, unknown>;
  imagenes: string[];
  // Degradado de la imagen provisional mientras el producto no tenga fotos.
  tono: [string, string];
  opciones: { nombre: string; valores: string[] }[];
  variantes: Variante[];
};

// shortcut: categorías fijas, deben coincidir con backend/db/seed.sql; pasar al API si se vuelven editables.
export const categorias: Categoria[] = [
  { slug: "ropa", nombre: "Ropa", descripcion: "Blusas, vestidos y básicos", icono: "ropa", tono: ["#f3d9d3", "#e2b6ae"] },
  { slug: "maquillaje", nombre: "Maquillaje", descripcion: "Labiales, bases y paletas", icono: "maquillaje", tono: ["#f6e2d6", "#e7bfa4"] },
  { slug: "accesorios", nombre: "Accesorios", descripcion: "Bolsos, aretes y collares", icono: "accesorios", tono: ["#efe3d0", "#d9c29c"] },
  { slug: "varios", nombre: "Varios", descripcion: "Cuidado, hogar y detalles", icono: "varios", tono: ["#ead9e4", "#cfaec3"] },
];

export const tonos: [string, string][] = [
  ["#f4dcd6", "#d9a69c"], ["#efe0cf", "#cdb08a"], ["#dfe3ec", "#9fa9c2"], ["#f2d3d3", "#c98585"],
  ["#f5e1d2", "#dcb497"], ["#ecd8cc", "#bf9a86"], ["#eadbc8", "#b8956a"], ["#f3ece2", "#d7c7a8"],
  ["#f1e6d6", "#cfb27d"], ["#e9dbe6", "#c39fb8"], ["#f4e7dc", "#d8b89c"], ["#f0dde4", "#cf9fb2"],
];

export function stockTotal(p: Producto) {
  return p.variantes.reduce((s, v) => s + v.stock, 0);
}
