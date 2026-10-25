import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormRestablecer } from "@/components/cuenta/formularios";
import { Aviso, TarjetaAcceso } from "@/components/cuenta/tarjeta-acceso";

export const metadata: Metadata = { title: "Contraseña nueva", robots: { index: false } };

export default function PaginaRestablecer(props: PageProps<"/cuenta/restablecer">) {
  return (
    <TarjetaAcceso titulo="Crea tu contraseña nueva">
      <Suspense fallback={<div className="h-56" />}>
        <Contenido {...props} />
      </Suspense>
    </TarjetaAcceso>
  );
}

async function Contenido({ searchParams }: PageProps<"/cuenta/restablecer">) {
  const { token } = await searchParams;
  if (typeof token !== "string" || !token) {
    return (
      <>
        <Aviso tipo="error">Este enlace no está completo. Ábrelo directamente desde el correo o pide uno nuevo.</Aviso>
        <Link href="/cuenta/recuperar" className="boton-primario w-full">Pedir un enlace nuevo</Link>
      </>
    );
  }
  return (
    <>
      <FormRestablecer token={token} />
      <p className="text-center text-xs text-cacao/85">Al guardarla se cerrará tu sesión en todos los dispositivos.</p>
    </>
  );
}
