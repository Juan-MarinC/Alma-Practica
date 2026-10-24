import type { Metadata } from "next";
import { Suspense } from "react";
import { Catalogo } from "@/components/catalogo";
import { obtenerProductos } from "@/lib/api";

export const metadata: Metadata = { title: "Catálogo" };

async function ContenidoCatalogo({ searchParams }: { searchParams: PageProps<"/catalogo">["searchParams"] }) {
  const [{ categoria, buscar }, productos] = await Promise.all([searchParams, obtenerProductos()]);
  const inicial = typeof categoria === "string" ? categoria : "todas";
  // La lupa del navbar llega con ?buscar y deja el cursor en el buscador.
  return <Catalogo key={inicial} categoriaInicial={inicial} productos={productos} enfocarBusqueda={buscar !== undefined} />;
}

export default function PaginaCatalogo({ searchParams }: PageProps<"/catalogo">) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <ContenidoCatalogo searchParams={searchParams} />
    </Suspense>
  );
}
