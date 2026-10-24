import Link from "next/link";
import { tienda } from "@/lib/config";
import { categorias } from "@/lib/data";

export function Footer() {
  return (
    <footer className="mt-24 bg-cacao text-crema/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <p className="font-serif text-4xl text-crema">{tienda.nombre}</p>
          <p className="mt-3 max-w-sm text-sm">{tienda.descripcion}</p>
        </div>
        <div>
          <p className="mb-4 text-xs tracking-[0.25em] text-crema uppercase">Tienda</p>
          <ul className="space-y-2 text-sm">
            {categorias.map((c) => (
              <li key={c.slug}>
                <Link href={`/catalogo?categoria=${c.slug}`} className="hover:text-crema">{c.nombre}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-4 text-xs tracking-[0.25em] text-crema uppercase">Ayuda</p>
          <ul className="space-y-2 text-sm">
            <li>Envíos de 2 a 5 días hábiles</li>
            <li>Cambios hasta 30 días después</li>
            <li>PSE, Nequi, tarjetas y Bancolombia</li>
            {tienda.whatsapp && (
              <li>
                <a href={`https://wa.me/${tienda.whatsapp}`} className="underline underline-offset-4 hover:text-crema">Escríbenos por WhatsApp</a>
              </li>
            )}
            <li>
              <Link href="/privacidad" className="underline underline-offset-4 hover:text-crema">Tratamiento de datos personales</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-crema/10 py-5 text-center text-xs text-crema/85">
        © 2026 {tienda.nombre}. Hecho en Colombia.
      </div>
    </footer>
  );
}
