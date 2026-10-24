import type { Metadata } from "next";
import LayoutTienda from "./(tienda)/layout";
import NoEncontrada from "./(tienda)/not-found";

export const metadata: Metadata = { title: "Página no encontrada" };

// URLs que no existen: solo la raíz las recibe y aquí no hay layout de tienda, así que se lo pone.
export default function NoEncontradaGlobal() {
  return (
    <LayoutTienda>
      <NoEncontrada />
    </LayoutTienda>
  );
}
