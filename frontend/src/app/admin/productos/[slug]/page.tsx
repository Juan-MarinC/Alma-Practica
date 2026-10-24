import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormProducto } from "@/components/admin/form-producto";
import { exigirAdmin, listarProductosAdmin } from "@/lib/admin";
import { guardarProducto } from "../../acciones";

async function Formulario({ params }: { params: PageProps<"/admin/productos/[slug]">["params"] }) {
  await exigirAdmin();
  const { slug } = await params;
  // shortcut: busca en el listado completo; agregar GET /admin/productos/:slug si el catálogo crece mucho.
  const p = (await listarProductosAdmin()).find((x) => x.slug === slug);
  if (!p) notFound();

  return (
    <>
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-serif text-4xl text-cacao">{p.nombre}</h1>
        {p.activo && (
          <Link href={`/producto/${p.slug}`} className="text-sm text-cacao/70 underline underline-offset-4 hover:text-cacao">
            Ver en la tienda
          </Link>
        )}
      </div>
      <FormProducto
        esNuevo={false}
        accion={guardarProducto.bind(null, p.slug)}
        inicial={{
          slug: p.slug,
          nombre: p.nombre,
          descripcion: p.descripcion,
          categoria: p.categoria,
          precio: String(p.precio),
          precioAntes: p.precioAntes === null ? "" : String(p.precioAntes),
          nuevo: !!p.nuevo,
          activo: p.activo,
          atributos: Object.entries(p.atributos)
            .map(([k, v]) => `${k}: ${v === true ? "sí" : v === false ? "no" : String(v)}`)
            .join("\n"),
          imagenes: p.imagenes.join("\n"),
          variantes: p.variantes.map((v) => ({
            sku: v.sku,
            opciones: Object.entries(v.opciones).map(([k, val]) => `${k}=${val}`).join(", "),
            // El API devuelve el precio ya resuelto; solo se muestra si difiere, para que siga al precio del producto.
            precio: v.precio !== p.precio ? String(v.precio) : "",
            stock: String(v.stock),
            stockAnterior: String(v.stock),
          })),
        }}
      />
    </>
  );
}

export default function PaginaEditar({ params }: PageProps<"/admin/productos/[slug]">) {
  return (
    <Suspense fallback={<p className="text-cacao/70">Cargando…</p>}>
      <Formulario params={params} />
    </Suspense>
  );
}
