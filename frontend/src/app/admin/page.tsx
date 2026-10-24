import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { exigirAdmin, listarProductosAdmin } from "@/lib/admin";
import { categorias } from "@/lib/data";
import { cn, formatoPrecio } from "@/lib/format";

async function ListaProductos() {
  await exigirAdmin();
  const productos = await listarProductosAdmin();
  const agotados = productos.filter((p) => p.activo && p.stockTotal === 0).length;

  return (
    <>
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          ["Productos", productos.length],
          ["Visibles", productos.filter((p) => p.activo).length],
          ["Agotados", agotados],
        ].map(([titulo, valor]) => (
          <div key={titulo} className="tarjeta-admin py-4">
            <p className="text-xs text-cacao/70">{titulo}</p>
            <p className={cn("font-serif text-3xl", titulo === "Agotados" && agotados > 0 && "text-vino")}>{valor}</p>
          </div>
        ))}
      </div>

      <div className="tarjeta-admin overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-cacao/10 text-left text-xs text-cacao/70">
            <tr>
              <th className="px-5 py-3 font-normal">Producto</th>
              <th className="px-5 py-3 font-normal">Categoría</th>
              <th className="px-5 py-3 text-right font-normal">Precio</th>
              <th className="px-5 py-3 text-right font-normal">Stock</th>
              <th className="px-5 py-3 font-normal">Estado</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => {
              const bajos = p.variantes.filter((v) => v.stock > 0 && v.stock <= 2).length;
              return (
                <tr key={p.id} className="border-b border-cacao/5 last:border-0 hover:bg-crema">
                  <td className="px-5 py-3">
                    <Link href={`/admin/productos/${p.slug}`} className="text-cacao hover:text-vino">{p.nombre}</Link>
                    <p className="text-xs text-cacao/70">
                      {p.variantes.length} {p.variantes.length === 1 ? "variante" : "variantes"}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-cacao/70">{categorias.find((c) => c.slug === p.categoria)?.nombre ?? p.categoria}</td>
                  <td className="px-5 py-3 text-right">{formatoPrecio(p.precio)}</td>
                  <td className={cn("px-5 py-3 text-right", p.stockTotal === 0 ? "text-vino" : bajos > 0 && "text-amber-700")}>
                    {p.stockTotal}
                    {p.stockTotal > 0 && bajos > 0 && <span className="block text-xs">{bajos} por agotarse</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs", p.activo ? "bg-emerald-50 text-emerald-700" : "bg-cacao/5 text-cacao/70")}>
                      {p.activo ? "Visible" : "Oculto"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {productos.length === 0 && <p className="p-10 text-center text-cacao/70">Aún no hay productos.</p>}
      </div>
    </>
  );
}

export default function PaginaAdmin() {
  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-4xl text-cacao">Productos</h1>
        <Link href="/admin/productos/nuevo" className="boton-primario">
          <Plus className="size-4" /> Nuevo producto
        </Link>
      </div>
      <Suspense fallback={<p className="text-cacao/70">Cargando productos…</p>}>
        <ListaProductos />
      </Suspense>
    </>
  );
}
