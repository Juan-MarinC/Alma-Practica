import { ArrowRight, CreditCard, RefreshCcw, Truck } from "lucide-react";
import Link from "next/link";
import { CarruselProductos } from "@/components/carrusel-productos";
import { Editorial } from "@/components/editorial";
import { SeccionCategorias } from "@/components/categorias";
import { Hero } from "@/components/hero";
import { obtenerProductos } from "@/lib/api";
import { categorias } from "@/lib/data";

export default async function Inicio() {
  const productos = await obtenerProductos();
  const nuevos = productos.filter((p) => p.nuevo);
  const conteo = Object.fromEntries(productos.map((p) => [p.categoria, productos.filter((x) => x.categoria === p.categoria).length]));
  const conFoto = productos.filter((p) => p.imagenes[0]);
  const muestras = Object.fromEntries(categorias.map((c) => [c.slug, conFoto.filter((p) => p.categoria === c.slug).map((p) => p.imagenes[0])]));
  // Collage del inicio: productos distintos a los que ya muestran las categorías, uno por categoría.
  const enCategorias = new Set(Object.values(muestras).map((fotos) => fotos[0]));
  const resto = conFoto.filter((p) => !enCategorias.has(p.imagenes[0]));
  const fotosHero = [...categorias.flatMap((c) => resto.find((p) => p.categoria === c.slug) ?? []), ...resto]
    .filter((p, i, lista) => lista.indexOf(p) === i)
    .slice(0, 3)
    .map((p) => ({ src: p.imagenes[0], alt: p.nombre, href: `/producto/${p.slug}` }));

  return (
    <>
      <Hero fotos={fotosHero} />
      <SeccionCategorias conteo={conteo} muestras={muestras} />

      <section className="py-16">
        <div className="mx-auto mb-10 flex max-w-7xl items-end justify-between px-5 md:px-8">
          <h2 className="font-serif text-4xl text-cacao md:text-5xl">Novedades</h2>
          <Link href="/catalogo" className="group flex items-center gap-2 text-sm text-cacao">
            Ver todo <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        {nuevos.length > 0 && <CarruselProductos productos={nuevos} />}
      </section>

      <Editorial productos={conFoto.filter((p) => p.categoria === "maquillaje")} />

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="grid gap-8 border-y border-cacao/10 py-10 md:grid-cols-3">
          {[
            { icono: Truck, titulo: "Envíos a toda Colombia", texto: "Gratis desde $250.000. Llega en 2 a 5 días hábiles." },
            { icono: CreditCard, titulo: "Paga como quieras", texto: "PSE, Nequi, tarjeta de crédito o débito, con pago seguro." },
            { icono: RefreshCcw, titulo: "Cambios fáciles", texto: "Tienes 30 días para cambiar tu producto sin complicaciones." },
          ].map(({ icono: Icono, titulo, texto }) => (
            <div key={titulo} className="flex gap-3">
              <Icono className="mt-0.5 size-5 shrink-0 text-vino" strokeWidth={1.5} aria-hidden />
              <div>
                <p className="font-medium text-cacao">{titulo}</p>
                <p className="mt-1 text-sm text-cacao/85">{texto}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
