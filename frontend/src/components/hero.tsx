import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { tienda } from "@/lib/config";
import { BotonEnlace } from "./boton";
import { TextoDividido } from "./texto-dividido";

// Fondo "Aurora" (inspirado en React Bits), quieto: el único movimiento del hero es la entrada del título.
function Aurora() {
  const manchas = [
    { color: "#f2c6c2", size: "60vw", pos: "top-[-20%] left-[-10%]" },
    { color: "#f6dcc8", size: "55vw", pos: "top-[10%] right-[-15%]" },
    { color: "#e9cfe0", size: "45vw", pos: "bottom-[-30%] left-[25%]" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {manchas.map((m) => (
        <div key={m.pos} className={`absolute rounded-full opacity-45 blur-3xl ${m.pos}`} style={{ width: m.size, height: m.size, background: m.color }} />
      ))}
    </div>
  );
}

export type FotoHero = { src: string; alt: string; href: string };

// Posiciones del collage en pantallas anchas (a los lados del título).
const LADOS = ["left-[5%] top-1/2 w-52 -translate-y-1/2", "right-[5%] top-1/2 w-52 -translate-y-1/2"];

// Plana, sin sombra ni inclinación: la foto es la que lleva el peso.
function Tarjeta({ foto, className }: { foto: FotoHero; className?: string }) {
  return (
    <Link href={foto.href} className={`block overflow-hidden rounded-[1.75rem] transition-transform duration-500 hover:scale-[1.03] ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={foto.src} alt={foto.alt} className="aspect-[4/5] w-full object-cover" />
    </Link>
  );
}

export function Hero({ fotos = [] }: { fotos?: FotoHero[] }) {
  return (
    <section className="relative isolate overflow-hidden bg-crema">
      <Aurora />
      {/* Fotos quietas a los lados: con el Aurora de fondo ya hay suficiente movimiento. */}
      {fotos.slice(0, 2).map((foto, i) => (
        <div key={foto.src} className={`aparecer absolute z-10 hidden xl:block ${LADOS[i]}`} style={{ animationDelay: `${0.3 + i * 0.12}s` }}>
          <Tarjeta foto={foto} />
        </div>
      ))}
      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center px-5 py-16 text-center md:min-h-[78vh] md:px-8 md:py-24">
        <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] text-cacao sm:text-7xl md:text-8xl">
          <TextoDividido texto="Hecho para que" />
          <br />
          <TextoDividido texto="te sientas tú" retraso={0.2} className="italic text-rosa" />
        </h1>
        {/* Entradas en CSS y cortas: la clienta llega desde redes con datos móviles y no debe esperar el JavaScript. */}
        <p className="aparecer mt-6 max-w-md text-base text-cacao/85 md:text-xl" style={{ animationDelay: "0.35s" }}>
          {tienda.descripcion}
        </p>
        {/* Los botones se ven desde el primer pintado. */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <BotonEnlace href="/catalogo">
            Comprar ahora <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </BotonEnlace>
          <BotonEnlace href="/catalogo?categoria=maquillaje" variante="claro">
            Ver maquillaje
          </BotonEnlace>
        </div>
        {fotos.length >= 3 && (
          <div className="aparecer mt-14 flex justify-center gap-3 xl:hidden" style={{ animationDelay: "0.45s" }}>
            {fotos.slice(0, 3).map((foto) => (
              <Tarjeta key={foto.src} foto={foto} className="w-24 sm:w-36" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
