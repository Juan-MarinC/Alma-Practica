"use client";

import { AnimatePresence, motion } from "motion/react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { categorias, type Producto } from "@/lib/data";
import { cn } from "@/lib/format";
import { TarjetaProducto } from "./tarjeta-producto";

const ordenes = {
  relevancia: "Destacados",
  nuevos: "Novedades",
  menor: "Menor precio",
  mayor: "Mayor precio",
} as const;

export function Catalogo({
  categoriaInicial,
  productos,
  enfocarBusqueda = false,
}: {
  categoriaInicial: string;
  productos: Producto[];
  enfocarBusqueda?: boolean;
}) {
  const [categoria, setCategoria] = useState(categoriaInicial);

  // La categoría queda en la URL: el enlace se puede compartir y "atrás" desde un producto vuelve al mismo filtro.
  function elegirCategoria(slug: string) {
    setCategoria(slug);
    window.history.replaceState(null, "", slug === "todas" ? "/catalogo" : `/catalogo?categoria=${slug}`);
  }
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<keyof typeof ordenes>("relevancia");

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const r = productos.filter(
      (p) => (categoria === "todas" || p.categoria === categoria) && (!q || p.nombre.toLowerCase().includes(q)),
    );
    if (orden === "menor") return [...r].sort((a, b) => a.precio - b.precio);
    if (orden === "mayor") return [...r].sort((a, b) => b.precio - a.precio);
    if (orden === "nuevos") return [...r].sort((a, b) => Number(!!b.nuevo) - Number(!!a.nuevo));
    return r;
  }, [productos, categoria, busqueda, orden]);

  const pestañas = [{ slug: "todas", nombre: "Todo" }, ...categorias];
  const actual = categorias.find((c) => c.slug === categoria);

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-5xl text-cacao md:text-6xl">
        {actual?.nombre ?? "Toda la tienda"}
      </motion.h1>
      <p className="mt-2 text-cacao/85">{actual?.descripcion ?? "Todo lo que tenemos para ti."}</p>

      <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="-mx-5 flex gap-1 overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:rounded-full md:bg-white/70 md:p-1 md:ring-1 md:ring-cacao/10">
          {pestañas.map((c) => (
            <button
              key={c.slug}
              onClick={() => elegirCategoria(c.slug)}
              aria-pressed={categoria === c.slug}
              className={cn("relative min-h-11 shrink-0 rounded-full px-4 py-2 text-sm whitespace-nowrap transition-colors", categoria === c.slug ? "text-crema" : "text-cacao/85 hover:text-cacao")}
            >
              {categoria === c.slug && (
                <motion.span layoutId="pestaña" className="absolute inset-0 rounded-full bg-cacao" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
              )}
              <span className="relative">{c.nombre}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded-full bg-white/70 px-4 ring-1 ring-cacao/10 focus-within:ring-2 focus-within:ring-rosa md:w-64">
            <Search className="size-4 text-cacao/85" aria-hidden />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              autoFocus={enfocarBusqueda}
              placeholder="Buscar"
              aria-label="Buscar productos"
              className="w-full bg-transparent py-2.5 text-base focus:outline-none md:text-sm"
            />
          </label>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as keyof typeof ordenes)}
            aria-label="Ordenar"
            className="min-h-11 rounded-full bg-white/70 px-4 text-sm ring-1 ring-cacao/10 focus:ring-2 focus:ring-rosa focus:outline-none"
          >
            {Object.entries(ordenes).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-8 text-sm text-cacao/85">{lista.length} {lista.length === 1 ? "producto" : "productos"}</p>
      <motion.div layout className="mt-4 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        {/* initial={false}: al cargar las tarjetas se ven de una vez; esta animación es solo para cambios de filtro. */}
        <AnimatePresence mode="popLayout" initial={false}>
          {lista.map((p) => (
            <motion.div key={p.slug} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <TarjetaProducto producto={p} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {lista.length === 0 && <p className="py-20 text-center text-cacao/85">No encontramos productos con esa búsqueda.</p>}
    </div>
  );
}
