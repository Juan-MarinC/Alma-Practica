import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Producto } from "@/lib/data";
import { formatoPrecio } from "@/lib/format";

// Bloque editorial: una categoría contada como historia, con sus productos en composición.
// Va en cacao para dar contraste y ritmo entre secciones claras (como los bloques oscuros de apple.com).
export function Editorial({ productos }: { productos: Producto[] }) {
  if (productos.length < 3) return null;
  const [a, b, c] = productos;
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <div className="grid items-center gap-10 overflow-hidden rounded-[2.5rem] bg-cacao p-8 text-crema md:grid-cols-2 md:p-14">
        <div>
          <h2 className="font-serif text-4xl leading-tight md:text-6xl">
            Tu piel, <span className="text-rosa italic">tu luz</span>
          </h2>
          <p className="mt-5 max-w-md text-crema/85">
            Tonos pensados para la piel colombiana: bases que se funden, labiales que duran y sombras para el día y la noche.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {productos.slice(0, 3).map((p) => (
              <li key={p.slug}>
                <Link href={`/producto/${p.slug}`} className="group flex items-center justify-between gap-4 border-b border-crema/15 pb-3">
                  <span className="group-hover:text-blush">{p.nombre}</span>
                  <span className="text-crema/85">{formatoPrecio(p.precio)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/catalogo?categoria=maquillaje" className="group mt-8 inline-flex items-center gap-2 rounded-full bg-crema px-6 py-3 text-sm text-cacao transition hover:bg-blush">
            Ver maquillaje <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-md">
          {[
            [a, "left-0 top-[6%] w-[52%]"],
            [c, "right-0 top-0 w-[46%]"],
            [b, "left-[24%] bottom-0 z-10 w-[54%]"],
          ].map(([p, pos]) => {
            const producto = p as Producto;
            return (
              // Aro del color del fondo en vez de sombra: separa las fotos superpuestas sin perder lo plano.
              <Link
                key={producto.slug}
                href={`/producto/${producto.slug}`}
                className={`absolute overflow-hidden rounded-[1.75rem] ring-4 ring-cacao transition-transform duration-500 hover:z-20 hover:scale-[1.03] ${pos}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={producto.imagenes[0]} alt={producto.nombre} loading="lazy" className="aspect-[4/5] w-full object-cover" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
