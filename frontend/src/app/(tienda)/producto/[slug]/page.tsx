import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DetalleProducto } from "@/components/detalle-producto";
import { TarjetaProducto } from "@/components/tarjeta-producto";
import { obtenerProducto, obtenerProductos } from "@/lib/api";

// Con Cache Components debe devolver al menos un slug, así que el build necesita el API arriba.
// Los productos creados después se generan al primer visitante.
export async function generateStaticParams() {
  return (await obtenerProductos()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  const producto = await obtenerProducto(slug);
  return { title: producto?.nombre ?? "Producto", description: producto?.descripcion };
}

export default function PaginaProducto(props: PageProps<"/producto/[slug]">) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
      <Suspense fallback={<p className="text-cacao/85">Cargando producto…</p>}>
        <Contenido {...props} />
      </Suspense>
    </div>
  );
}

async function Contenido({ params }: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  const [producto, productos] = await Promise.all([obtenerProducto(slug), obtenerProductos()]);
  if (!producto) notFound();
  const relacionados = productos.filter((p) => p.categoria === producto.categoria && p.slug !== producto.slug).slice(0, 4);

  return (
    <>
      <DetalleProducto producto={producto} />
      {relacionados.length > 0 && (
        <section className="mt-28">
          <h2 className="mb-10 font-serif text-4xl text-cacao">También te puede gustar</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {relacionados.map((p) => (
              <TarjetaProducto key={p.slug} producto={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
