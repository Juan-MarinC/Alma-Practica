import Link from "next/link";
import { categorias } from "@/lib/data";
import { ImagenProducto } from "./imagen-producto";

export function SeccionCategorias({ conteo, muestras = {} }: { conteo: Record<string, number>; muestras?: Record<string, string[]> }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <h2 className="mb-10 font-serif text-4xl text-cacao md:text-5xl">Compra por categoría</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {categorias.map((c) => {
          const total = conteo[c.slug] ?? 0;
          return (
            <div key={c.slug}>
              <Link href={`/catalogo?categoria=${c.slug}`} className="group block">
                <div className="overflow-hidden rounded-[2rem]">
                  <ImagenProducto
                    tono={c.tono}
                    categoria={c.icono}
                    src={muestras[c.slug]?.[0]}
                    grande
                    className="aspect-[4/5] transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <p className="mt-4 flex flex-col px-1 text-cacao sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium">{c.nombre}</span>
                  <span className="text-sm text-cacao/85">{total} {total === 1 ? "producto" : "productos"}</span>
                </p>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
