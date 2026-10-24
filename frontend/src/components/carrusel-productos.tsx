"use client";

import { useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Producto } from "@/lib/data";
import { cn } from "@/lib/format";
import { TarjetaProducto } from "./tarjeta-producto";

// Fila deslizable con el dedo (scroll-snap) y flechas en pantallas con mouse.
// Los bordes se alinean con el contenedor max-w-7xl del resto de la página.
const MARGEN = "max(1.25rem, calc((100% - 80rem) / 2 + 2rem))";

export function CarruselProductos({ productos }: { productos: Producto[] }) {
  const fila = useRef<HTMLUListElement>(null);
  const reducir = useReducedMotion();
  const [bordes, setBordes] = useState({ inicio: true, fin: false });

  function medir() {
    const el = fila.current;
    if (!el) return;
    setBordes({ inicio: el.scrollLeft <= 4, fin: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }

  useEffect(() => {
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  function mover(sentido: 1 | -1) {
    const el = fila.current;
    if (!el) return;
    el.scrollBy({ left: sentido * el.clientWidth * 0.8, behavior: reducir ? "auto" : "smooth" });
  }

  return (
    <div className="relative">
      <ul
        ref={fila}
        onScroll={medir}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] md:gap-6"
        style={{ paddingInline: MARGEN, scrollPaddingInline: MARGEN }}
      >
        {productos.map((p) => (
          <li key={p.slug} className="w-[68%] shrink-0 snap-start sm:w-64 md:w-72">
            <TarjetaProducto producto={p} />
          </li>
        ))}
      </ul>
      {[
        { sentido: -1 as const, oculto: bordes.inicio, Icono: ChevronLeft, etiqueta: "Ver anteriores", lado: "left-4 md:left-6" },
        { sentido: 1 as const, oculto: bordes.fin, Icono: ChevronRight, etiqueta: "Ver más", lado: "right-4 md:right-6" },
      ].map(({ sentido, oculto, Icono, etiqueta, lado }) => (
        <button
          key={sentido}
          onClick={() => mover(sentido)}
          aria-label={etiqueta}
          disabled={oculto}
          className={cn(
            "absolute top-[38%] hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-cacao shadow-lg shadow-cacao/10 ring-1 ring-cacao/10 backdrop-blur transition-opacity hover:bg-white md:grid",
            lado,
            oculto && "pointer-events-none opacity-0",
          )}
        >
          <Icono className="size-5" />
        </button>
      ))}
    </div>
  );
}
