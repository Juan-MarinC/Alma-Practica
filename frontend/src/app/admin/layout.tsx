import type { Metadata } from "next";
import Link from "next/link";
import { tienda } from "@/lib/config";
import { salir } from "./acciones";

export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-crema">
      <header className="border-b border-cacao/10 bg-white/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/admin" className="font-serif text-2xl text-cacao">
            {tienda.nombre} <span className="font-sans text-xs tracking-[0.3em] text-cacao/70 uppercase">Panel</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="text-cacao/70 hover:text-cacao">Productos</Link>
            <Link href="/admin/pedidos" className="text-cacao/70 hover:text-cacao">Pedidos</Link>
            <Link href="/" className="text-cacao/70 hover:text-cacao">Ver tienda</Link>
            <form action={salir}>
              <button className="text-cacao/70 hover:text-vino">Salir</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </div>
  );
}
