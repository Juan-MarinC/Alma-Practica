"use client";

import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
import { tienda } from "@/lib/config";
import { categorias } from "@/lib/data";
import { cn } from "@/lib/format";
import { useCarrito } from "./carrito";

export function Navbar() {
  const { cantidadTotal, abrir } = useCarrito();
  const { scrollY } = useScroll();
  const [compacta, setCompacta] = useState(false);
  const [menu, setMenu] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setCompacta(y > 24));

  return (
    <header className="sticky top-0 z-40">
      {/* La franja se pliega al bajar: en el celular cada píxel de alto cuenta. */}
      <div className={cn("grid bg-cacao transition-[grid-template-rows] duration-500", compacta ? "grid-rows-[0fr]" : "grid-rows-[1fr]")}>
        <p className="overflow-hidden text-center text-[12px] tracking-wide text-crema/90">
          <span className="block py-2">Envío gratis en compras desde $250.000 a toda Colombia</span>
        </p>
      </div>
      <nav
        className={cn(
          "transition-all duration-500",
          compacta ? "bg-crema/80 shadow-[0_1px_0_rgba(61,43,43,0.08)] backdrop-blur-xl" : "bg-crema",
        )}
      >
        <div className={cn("mx-auto flex max-w-7xl items-center justify-between px-5 transition-all duration-500 md:px-8", compacta ? "h-16" : "h-20")}>
          <Link href="/" className="font-serif text-3xl tracking-tight text-cacao">
            {tienda.nombre}
            <span className="ml-1.5 hidden align-middle font-sans text-[10px] tracking-[0.3em] text-cacao/85 uppercase sm:inline">{tienda.eslogan}</span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {categorias.map((c) => (
              <li key={c.slug}>
                <Link href={`/catalogo?categoria=${c.slug}`} className="rounded-full px-4 py-2 text-[15px] text-cacao/85 transition-colors hover:text-cacao">
                  {c.nombre}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/catalogo" className="rounded-full px-4 py-2 text-[15px] text-cacao/85 hover:text-cacao">
                Ver todo
              </Link>
            </li>
          </ul>

          <div className="flex items-center gap-1">
            <Link href="/catalogo?buscar" aria-label="Buscar" className="grid size-11 place-items-center rounded-full text-cacao/80 hover:bg-cacao/5">
              <Search className="size-[18px]" />
            </Link>
            {/* Sin estado de sesión aquí: /cuenta manda a entrar si no hay sesión, y el navbar sigue siendo estático. */}
            <Link href="/cuenta" aria-label="Mi cuenta" className="grid size-11 place-items-center rounded-full text-cacao/80 hover:bg-cacao/5">
              <User className="size-[18px]" />
            </Link>
            <button onClick={abrir} aria-label="Abrir carrito" className="relative grid size-11 place-items-center rounded-full text-cacao/80 hover:bg-cacao/5">
              <ShoppingBag className="size-[18px]" />
              {cantidadTotal > 0 && (
                <motion.span
                  key={cantidadTotal}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute top-1 right-1 grid size-[18px] place-items-center rounded-full bg-vino text-[10px] font-semibold text-white"
                >
                  {cantidadTotal}
                </motion.span>
              )}
            </button>
            <button
              onClick={() => setMenu((m) => !m)}
              aria-label={menu ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menu}
              aria-controls="menu-movil"
              className="grid size-11 place-items-center rounded-full text-cacao/80 hover:bg-cacao/5 md:hidden"
            >
              {menu ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {menu && (
          <ul id="menu-movil" className="border-t border-cacao/10 px-5 pb-4 md:hidden">
            {[...categorias.map((c) => ({ href: `/catalogo?categoria=${c.slug}`, nombre: c.nombre })), { href: "/catalogo", nombre: "Ver todo" }].map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setMenu(false)} className="flex min-h-12 items-center border-b border-cacao/5 font-serif text-2xl text-cacao">
                  {l.nombre}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  );
}
