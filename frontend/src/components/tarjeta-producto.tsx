import Link from "next/link";
import { stockTotal, type Producto } from "@/lib/data";
import { formatoPrecio } from "@/lib/format";
import { ImagenProducto } from "./imagen-producto";

// Tarjeta de producto: visible desde el primer pintado (sin entrada al hacer scroll); la foto se acerca un poco al pasar el mouse.
export function TarjetaProducto({ producto }: { producto: Producto }) {
  const descuento = producto.precioAntes ? Math.round((1 - producto.precio / producto.precioAntes) * 100) : 0;

  return (
    <div>
      <Link href={`/producto/${producto.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-3xl">
          <ImagenProducto tono={producto.tono} categoria={producto.categoria} src={producto.imagenes[0]} alt={producto.nombre} className="aspect-[4/5] transition-transform duration-700 ease-out group-hover:scale-105" />
          <div className="absolute top-3 left-3 flex gap-1.5">
            {producto.nuevo && <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium tracking-wider text-cacao uppercase backdrop-blur">Nuevo</span>}
            {descuento > 0 && <span className="rounded-full bg-vino px-3 py-1 text-[11px] font-medium tracking-wider text-white uppercase">-{descuento}%</span>}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-1 px-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div>
            <p className="text-base leading-snug text-cacao">{producto.nombre}</p>
            <p className="mt-0.5 text-[13px] text-cacao/85 capitalize">{producto.categoria}</p>
            {stockTotal(producto) === 0 && <p className="mt-0.5 text-xs text-vino">Agotado</p>}
          </div>
          <div className="flex items-baseline gap-2 sm:block sm:text-right">
            <p className="text-base font-semibold text-cacao">{formatoPrecio(producto.precio)}</p>
            {producto.precioAntes && <p className="text-xs text-cacao/70 line-through">{formatoPrecio(producto.precioAntes)}</p>}
          </div>
        </div>
      </Link>
    </div>
  );
}
