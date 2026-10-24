"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { tienda } from "@/lib/config";
import { formatoPrecio } from "@/lib/format";
import { useCarrito } from "./carrito";
import { ImagenProducto } from "./imagen-producto";
import { NumeroAnimado } from "./numero-animado";

export function PanelCarrito() {
  const { items, abierto, cerrar, cambiarCantidad, subtotal } = useCarrito();
  const falta = Math.max(0, tienda.envioGratisDesde - subtotal);
  const progreso = Math.min(100, (subtotal / tienda.envioGratisDesde) * 100);

  return (
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-cacao/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cerrar}
          />
          <motion.aside
            className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-crema shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
          >
            <div className="flex items-center justify-between border-b border-cacao/10 px-6 py-5">
              <h2 className="font-serif text-2xl text-cacao">Tu bolsa</h2>
              <button onClick={cerrar} aria-label="Cerrar" className="grid size-9 place-items-center rounded-full hover:bg-cacao/5">
                <X className="size-5 text-cacao" />
              </button>
            </div>

            {items.length > 0 && (
              <div className="px-6 pt-4">
                <p className="text-xs text-cacao/85">
                  {falta > 0 ? (
                    <>Te faltan <strong className="text-cacao">{formatoPrecio(falta)}</strong> para envío gratis</>
                  ) : (
                    <>¡Tienes envío gratis! ✨</>
                  )}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cacao/10">
                  <motion.div className="h-full rounded-full bg-rosa" animate={{ width: `${progreso}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <ShoppingBag className="mx-auto size-10 text-cacao/25" strokeWidth={1.2} />
                    <p className="mt-4 text-cacao/85">Tu bolsa está vacía</p>
                    <Link href="/catalogo" onClick={cerrar} className="mt-4 inline-block text-sm text-vino underline underline-offset-4">
                      Descubrir productos
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="space-y-4">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                        <motion.li
                          key={item.sku}
                          layout
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 30, height: 0 }}
                          className="flex gap-4"
                        >
                          <ImagenProducto tono={item.tono} categoria={item.categoria} src={item.imagen} alt={item.nombre} className="size-24 shrink-0 rounded-2xl" />
                          <div className="flex flex-1 flex-col">
                            <p className="text-sm text-cacao">{item.nombre}</p>
                            {item.detalle && <p className="text-xs text-cacao/85">{item.detalle}</p>}
                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center rounded-full ring-1 ring-cacao/15">
                                <button aria-label="Quitar uno" onClick={() => cambiarCantidad(item.sku, item.cantidad - 1)} className="grid size-8 place-items-center">
                                  <Minus className="size-3.5" />
                                </button>
                                <span className="w-6 text-center text-sm">{item.cantidad}</span>
                                <button
                                  aria-label="Agregar uno"
                                  disabled={item.cantidad >= item.stock}
                                  onClick={() => cambiarCantidad(item.sku, item.cantidad + 1)}
                                  className="grid size-8 place-items-center disabled:opacity-30"
                                >
                                  <Plus className="size-3.5" />
                                </button>
                              </div>
                              <p className="text-sm font-medium text-cacao">{formatoPrecio(item.precio * item.cantidad)}</p>
                            </div>
                          </div>
                        </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-cacao/10 px-6 py-5">
                <div className="flex justify-between text-cacao">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    <NumeroAnimado valor={subtotal} moneda />
                  </span>
                </div>
                <p className="mt-1 text-xs text-cacao/85">El envío se calcula en el pago.</p>
                <Link
                  href="/checkout"
                  onClick={cerrar}
                  className="mt-4 block w-full rounded-full bg-cacao py-3.5 text-center text-sm font-medium tracking-wide text-crema transition hover:bg-cacao/90"
                >
                  Ir a pagar
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
