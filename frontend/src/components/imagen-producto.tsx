import { Gem, Shirt, Sparkles, Flower2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/format";

const iconos: Record<string, LucideIcon> = {
  ropa: Shirt,
  maquillaje: Sparkles,
  accesorios: Gem,
  varios: Flower2,
};

// Muestra la foto del producto o, si aún no tiene, un degradado con el ícono de su categoría.
export function ImagenProducto({
  tono,
  categoria,
  src,
  alt = "",
  className,
  grande,
}: {
  tono: [string, string];
  categoria: string;
  src?: string;
  alt?: string;
  className?: string;
  grande?: boolean;
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden", className)} style={{ background: tono[0] }}>
        {/* Las fotos vienen de URLs que carga el panel; next/image exigiría declarar cada dominio. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className="absolute inset-0 size-full object-cover" />
      </div>
    );
  }
  const Icono = iconos[categoria] ?? Sparkles;
  return (
    <div
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      className={cn("relative grid place-items-center overflow-hidden", className)}
      style={{ background: `radial-gradient(120% 90% at 30% 20%, ${tono[0]} 0%, ${tono[1]} 100%)` }}
    >
      <div className="absolute -right-10 -bottom-10 size-48 rounded-full bg-white/25 blur-2xl" />
      <div className="absolute -top-8 -left-8 size-32 rounded-full bg-white/30 blur-xl" />
      <Icono className={cn("relative text-white/80 drop-shadow-sm", grande ? "size-28" : "size-14")} strokeWidth={1.1} />
    </div>
  );
}
