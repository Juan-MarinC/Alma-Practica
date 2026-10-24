import { BotonEnlace } from "@/components/boton";

// notFound() dentro de la tienda (p. ej. un producto retirado): ya va dentro del layout con navbar y footer.
export default function NoEncontrada() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-5 py-16 text-center">
      <div>
        <p className="text-sm tracking-[0.3em] text-vino uppercase">Error 404</p>
        <h1 className="mt-3 font-serif text-4xl text-cacao md:text-5xl">No encontramos esta página</h1>
        <p className="mt-4 text-cacao/85">Puede que ya no esté disponible o que el enlace haya cambiado.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <BotonEnlace href="/catalogo">Ver catálogo</BotonEnlace>
          <BotonEnlace href="/" variante="claro">
            Volver al inicio
          </BotonEnlace>
        </div>
      </div>
    </div>
  );
}
