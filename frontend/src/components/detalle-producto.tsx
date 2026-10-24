"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronRight, ShieldCheck, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { categorias, type Producto } from "@/lib/data";
import { cn, formatoPrecio } from "@/lib/format";
import { useCarrito } from "./carrito";
import { ImagenProducto } from "./imagen-producto";

export function DetalleProducto({ producto }: { producto: Producto }) {
  const { agregar } = useCarrito();
  // Arranca en la primera variante con stock, para no abrir el producto mostrando "Agotado".
  const [seleccion, setSeleccion] = useState<Record<string, string>>(
    () => (producto.variantes.find((v) => v.stock > 0) ?? producto.variantes[0])?.opciones ?? {},
  );
  const [ampliada, setAmpliada] = useState(false);
  const [foto, setFoto] = useState(0);
  const [agregado, setAgregado] = useState(false);

  const variante = useMemo(
    () => producto.variantes.find((v) => Object.entries(seleccion).every(([k, val]) => v.opciones[k] === val)),
    [producto, seleccion],
  );
  const stock = variante?.stock ?? 0;
  const precio = variante?.precio ?? producto.precio;
  const detalles = Object.entries(producto.atributos).filter(([, v]) => ["string", "number", "boolean"].includes(typeof v));
  const categoria = categorias.find((c) => c.slug === producto.categoria);

  function stockDe(opcion: string, valor: string) {
    const prueba = { ...seleccion, [opcion]: valor };
    return producto.variantes.find((v) => Object.entries(prueba).every(([k, val]) => v.opciones[k] === val))?.stock ?? 0;
  }

  return (
    <>
      <nav className="mb-8 flex items-center gap-1 text-xs text-cacao/85">
        <Link href="/" className="hover:text-cacao">Inicio</Link>
        <ChevronRight className="size-3" />
        <Link href={`/catalogo?categoria=${producto.categoria}`} className="hover:text-cacao">{categoria?.nombre}</Link>
        <ChevronRight className="size-3" />
        <span className="text-cacao">{producto.nombre}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="grid gap-3">
          {/* "Morphing Dialog" (Motion Primitives): la foto crece hasta pantalla completa. */}
          <motion.button layoutId={`foto-${producto.slug}`} onClick={() => setAmpliada(true)} aria-label="Ampliar foto" className="cursor-zoom-in overflow-hidden rounded-[2rem]">
            <ImagenProducto tono={producto.tono} categoria={producto.categoria} src={producto.imagenes[foto]} alt={producto.nombre} grande className="aspect-[4/5]" />
          </motion.button>
          {producto.imagenes.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {producto.imagenes.slice(0, 8).map((src, i) => (
                <button key={src} onClick={() => setFoto(i)} aria-label={`Ver foto ${i + 1}`} className={cn("overflow-hidden rounded-2xl ring-2 transition", foto === i ? "ring-cacao" : "ring-transparent opacity-75 hover:opacity-100")}>
                  <ImagenProducto tono={producto.tono} categoria={producto.categoria} src={src} className="aspect-square" />
                </button>
              ))}
            </div>
          ) : (
            producto.imagenes.length === 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <ImagenProducto
                    key={i}
                    tono={[producto.tono[i % 2], producto.tono[(i + 1) % 2]]}
                    categoria={producto.categoria}
                    className="aspect-square rounded-2xl opacity-80"
                  />
                ))}
              </div>
            )
          )}
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="md:sticky md:top-32 md:self-start">
          <h1 className="mt-2 font-serif text-4xl leading-tight text-cacao md:text-5xl">{producto.nombre}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <p className="text-2xl text-cacao">{formatoPrecio(precio)}</p>
            {producto.precioAntes && producto.precioAntes > precio && <p className="text-cacao/70 line-through">{formatoPrecio(producto.precioAntes)}</p>}
          </div>
          <p className="mt-1 text-xs text-cacao/85">IVA incluido</p>
          <p className="mt-6 leading-relaxed text-cacao/85">{producto.descripcion}</p>

          {producto.opciones.map((op) => (
            <div key={op.nombre} className="mt-8">
              <p className="mb-3 text-sm text-cacao">
                {op.nombre}: <span className="text-cacao/85">{seleccion[op.nombre]}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {op.valores.map((val) => {
                  const activo = seleccion[op.nombre] === val;
                  const agotado = stockDe(op.nombre, val) === 0;
                  return (
                    <button
                      key={val}
                      onClick={() => setSeleccion((s) => ({ ...s, [op.nombre]: val }))}
                      className={cn(
                        "relative min-h-11 min-w-12 rounded-full px-4 py-2 text-sm ring-1 transition-colors",
                        activo ? "text-crema ring-cacao" : "text-cacao ring-cacao/20 hover:ring-cacao/50",
                        agotado && "text-cacao/35 line-through",
                      )}
                    >
                      {activo && <motion.span layoutId={`op-${op.nombre}`} className="absolute inset-0 rounded-full bg-cacao" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                      <span className="relative">{val}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <p className={cn("mt-6 flex items-center gap-2 text-sm", stock > 0 ? "text-cacao" : "text-vino")}>
            <span className={cn("size-2 rounded-full", stock > 0 ? "bg-oro" : "bg-rosa")} />
            {stock === 0 ? "Agotado en esta opción" : stock <= 3 ? `Solo quedan ${stock}` : "Disponible"}
          </p>

          <button
            disabled={!variante || stock === 0}
            onClick={() => {
              if (!variante) return;
              agregar({
                slug: producto.slug,
                sku: variante.sku,
                nombre: producto.nombre,
                detalle: Object.values(variante.opciones).join(" · "),
                precio,
                stock,
                categoria: producto.categoria,
                tono: producto.tono,
                imagen: producto.imagenes[0],
              });
              setAgregado(true);
              setTimeout(() => setAgregado(false), 1800);
            }}
            className="relative mt-6 h-14 w-full overflow-hidden rounded-full bg-cacao text-sm font-medium tracking-wide text-crema transition hover:bg-cacao/90 disabled:cursor-not-allowed disabled:bg-cacao/30"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={agregado ? "ok" : "add"}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                {agregado ? (<><Check className="size-4" /> Agregado a tu bolsa</>) : stock === 0 ? "Agotado" : "Agregar a la bolsa"}
              </motion.span>
            </AnimatePresence>
          </button>

          {detalles.length > 0 && (
            <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-cacao/10 pt-6 text-sm">
              {detalles.map(([clave, valor]) => (
                <div key={clave} className="contents">
                  <dt className="text-cacao/85 capitalize">{clave}</dt>
                  <dd className="text-cacao">{valor === true ? "Sí" : valor === false ? "No" : String(valor)}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-8 space-y-3 border-t border-cacao/10 pt-6 text-sm text-cacao/85">
            <p className="flex items-center gap-3"><Truck className="size-4 text-vino" /> Envío a toda Colombia en 2 a 5 días hábiles</p>
            <p className="flex items-center gap-3"><ShieldCheck className="size-4 text-vino" /> Pago seguro con PSE, Nequi o tarjeta</p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {ampliada && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-cacao/40 p-6 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAmpliada(false)}>
            <motion.div layoutId={`foto-${producto.slug}`} className="w-full max-w-xl cursor-zoom-out overflow-hidden rounded-[2rem]">
              <ImagenProducto tono={producto.tono} categoria={producto.categoria} src={producto.imagenes[foto]} alt={producto.nombre} grande className="aspect-[4/5]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
