"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { sinReiniciar } from "@/lib/formularios";
import type { EstadoFormulario } from "@/app/admin/acciones";
import { categorias } from "@/lib/data";

// stockAnterior: stock al abrir el formulario (vacío en filas nuevas); el backend rechaza si cambió por una venta.
type FilaVariante = { sku: string; opciones: string; precio: string; stock: string; stockAnterior: string };

export type ValoresProducto = {
  slug: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: string;
  precioAntes: string;
  nuevo: boolean;
  activo: boolean;
  atributos: string;
  imagenes: string;
  variantes: FilaVariante[];
};

const aSlug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

let siguienteClave = 0;
// Cada fila necesita una clave estable para que React no mezcle los campos al borrar una.
const conClave = (v: FilaVariante) => ({ ...v, clave: siguienteClave++ });

export function FormProducto({
  inicial,
  accion,
  esNuevo,
}: {
  inicial: ValoresProducto;
  accion: (estado: EstadoFormulario, datos: FormData) => Promise<EstadoFormulario>;
  esNuevo: boolean;
}) {
  const [estado, enviar, enviando] = useActionState(accion, { errores: [] });
  const [nombre, setNombre] = useState(inicial.nombre);
  const [slug, setSlug] = useState(inicial.slug);
  const [slugTocado, setSlugTocado] = useState(!esNuevo);
  const [variantes, setVariantes] = useState(() => inicial.variantes.map(conClave));

  const cambiarVariante = (clave: number, campo: keyof FilaVariante, valor: string) =>
    setVariantes((vs) => vs.map((v) => (v.clave === clave ? { ...v, [campo]: valor } : v)));

  return (
    <form action={enviar} onSubmit={sinReiniciar(enviar)} className="space-y-8">
      {estado.errores.length > 0 && (
        <div role="alert" className="rounded-2xl bg-rosa/10 p-4 text-sm text-vino">
          <p className="font-medium">No se pudo guardar:</p>
          <ul className="mt-1 list-disc pl-5">
            {estado.errores.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      )}

      <section className="tarjeta-admin grid gap-4 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="etiqueta">Nombre</span>
          <input
            name="nombre"
            required
            maxLength={160}
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (!slugTocado) setSlug(aSlug(e.target.value));
            }}
            className="campo"
          />
        </label>
        <label>
          <span className="etiqueta">Slug (dirección web)</span>
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTocado(true);
            }}
            className="campo font-mono text-sm"
          />
          <span className="ayuda">/producto/{slug || "…"}</span>
        </label>
        <label>
          <span className="etiqueta">Categoría</span>
          <select name="categoria" defaultValue={inicial.categoria} className="campo">
            {categorias.map((c) => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}
          </select>
        </label>
        <label>
          <span className="etiqueta">Precio (COP)</span>
          <input name="precio" required inputMode="numeric" defaultValue={inicial.precio} placeholder="129900" className="campo" />
        </label>
        <label>
          <span className="etiqueta">Precio antes (opcional)</span>
          <input name="precioAntes" inputMode="numeric" defaultValue={inicial.precioAntes} placeholder="Para mostrar descuento" className="campo" />
        </label>
        <label className="md:col-span-2">
          <span className="etiqueta">Descripción</span>
          <textarea name="descripcion" rows={3} maxLength={5000} defaultValue={inicial.descripcion} className="campo" />
        </label>
        <div className="flex flex-wrap gap-6 md:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="activo" defaultChecked={inicial.activo} className="size-4 accent-cacao" /> Visible en la tienda
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="nuevo" defaultChecked={inicial.nuevo} className="size-4 accent-cacao" /> Marcar como nuevo
          </label>
        </div>
      </section>

      <section className="tarjeta-admin">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl">Variantes e inventario</h2>
            <p className="ayuda">
              Opciones como <code>Talla=M, Color=Negro</code>; vacías si el producto no tiene opciones. Precio propio vacío = precio del producto.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setVariantes((vs) => [...vs, conClave({ sku: "", opciones: "", precio: "", stock: "0", stockAnterior: "" })])}
            className="boton-secundario"
          >
            <Plus className="size-4" /> Variante
          </button>
        </div>
        <div className="space-y-2">
          <div className="hidden grid-cols-[1fr_2fr_1fr_6rem_2.5rem] gap-2 px-1 text-xs text-cacao/70 md:grid">
            <span>SKU</span>
            <span>Opciones</span>
            <span>Precio propio</span>
            <span>Stock</span>
            <span />
          </div>
          {variantes.map((v) => (
            <div key={v.clave} className="grid grid-cols-2 gap-2 rounded-xl bg-crema p-2 md:grid-cols-[1fr_2fr_1fr_6rem_2.5rem] md:bg-transparent md:p-0">
              <input type="hidden" name="stockAnterior" value={v.stockAnterior} />
              <input name="sku" required aria-label="SKU" placeholder="SKU" value={v.sku} onChange={(e) => cambiarVariante(v.clave, "sku", e.target.value)} className="campo font-mono text-sm" />
              <input name="opciones" aria-label="Opciones" placeholder="Talla=M, Color=Negro" value={v.opciones} onChange={(e) => cambiarVariante(v.clave, "opciones", e.target.value)} className="campo" />
              <input name="precioVariante" aria-label="Precio propio" inputMode="numeric" placeholder="—" value={v.precio} onChange={(e) => cambiarVariante(v.clave, "precio", e.target.value)} className="campo" />
              <input name="stock" aria-label="Stock" inputMode="numeric" required value={v.stock} onChange={(e) => cambiarVariante(v.clave, "stock", e.target.value)} className="campo" />
              <button
                type="button"
                aria-label="Quitar variante"
                disabled={variantes.length === 1}
                onClick={() => setVariantes((vs) => vs.filter((x) => x.clave !== v.clave))}
                className="grid h-11 place-items-center rounded-xl text-cacao/70 hover:bg-rosa/10 hover:text-vino disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="tarjeta-admin grid gap-4 md:grid-cols-2">
        <label>
          <span className="etiqueta">Fotos: una por línea (URL https o ruta como /productos/foto.jpg). La primera es la principal</span>
          <textarea name="imagenes" rows={4} defaultValue={inicial.imagenes} placeholder="/productos/foto-1.jpg" className="campo font-mono text-xs" />
        </label>
        <label>
          <span className="etiqueta">Detalles: uno por línea</span>
          <textarea name="atributos" rows={4} defaultValue={inicial.atributos} placeholder={"material: Seda\ncuidado: Lavar a mano\nvegano: sí"} className="campo" />
        </label>
      </section>

      <div className="flex justify-end gap-3">
        <Link href="/admin" className="boton-secundario">Cancelar</Link>
        <button disabled={enviando} className="boton-primario">
          {enviando ? "Guardando…" : esNuevo ? "Crear producto" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
