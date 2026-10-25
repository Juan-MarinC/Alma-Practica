import type { Metadata } from "next";
import Link from "next/link";
import { FormRecuperar } from "@/components/cuenta/formularios";
import { TarjetaAcceso } from "@/components/cuenta/tarjeta-acceso";

export const metadata: Metadata = { title: "Recuperar contraseña", robots: { index: false } };

export default function PaginaRecuperar() {
  return (
    <TarjetaAcceso
      titulo="¿Olvidaste tu contraseña?"
      bajada="Escribe el correo de tu cuenta y te enviamos un enlace para crear una nueva. Sirve también si entras con Google y quieres una contraseña."
    >
      <FormRecuperar />
      <p className="border-t border-cacao/10 pt-5 text-center text-sm">
        <Link href="/cuenta/entrar" className="text-cacao/85 underline underline-offset-4 hover:text-vino">Volver a entrar</Link>
      </p>
    </TarjetaAcceso>
  );
}
