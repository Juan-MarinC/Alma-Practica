import Link from "next/link";
import { cn } from "@/lib/format";

// Botón-enlace de la tienda. Respuesta táctil al presionar, sin efectos que solo existen con mouse.
export function BotonEnlace({
  href,
  children,
  variante = "oscuro",
}: {
  href: string;
  children: React.ReactNode;
  variante?: "oscuro" | "claro";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-12 items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-medium tracking-wide transition duration-200 active:scale-[0.98]",
        variante === "oscuro" ? "bg-cacao text-crema hover:bg-cacao/90" : "bg-white/70 text-cacao ring-1 ring-cacao/15 backdrop-blur hover:bg-white",
      )}
    >
      {children}
    </Link>
  );
}
