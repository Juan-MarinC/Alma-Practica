import type { Metadata } from "next";
import Link from "next/link";
import { TarjetaAcceso } from "@/components/cuenta/tarjeta-acceso";

export const metadata: Metadata = { title: "Cuenta eliminada", robots: { index: false } };

export default function PaginaCuentaEliminada() {
  return (
    <TarjetaAcceso titulo="Tu cuenta fue eliminada">
      <p className="text-cacao/85">
        Borramos tu cuenta, tus direcciones guardadas y tus sesiones. Puedes seguir comprando como invitada cuando quieras.
      </p>
      <Link href="/" className="boton-primario w-full">Volver a la tienda</Link>
    </TarjetaAcceso>
  );
}
