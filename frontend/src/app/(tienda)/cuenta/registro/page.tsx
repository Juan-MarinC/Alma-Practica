import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FormRegistro } from "@/components/cuenta/formularios";
import { AccesoGoogle, TarjetaAcceso } from "@/components/cuenta/tarjeta-acceso";
import { obtenerCuenta, rutaSegura } from "@/lib/cuenta";

export const metadata: Metadata = { title: "Crear cuenta", robots: { index: false } };

export default function PaginaRegistro(props: PageProps<"/cuenta/registro">) {
  return (
    <TarjetaAcceso titulo="Crea tu cuenta" bajada="Guarda tus direcciones y sigue tus pedidos. Comprar sin cuenta sigue siendo posible.">
      <Suspense fallback={<div className="h-[32rem]" />}>
        <Contenido {...props} />
      </Suspense>
    </TarjetaAcceso>
  );
}

async function Contenido({ searchParams }: PageProps<"/cuenta/registro">) {
  const volver = rutaSegura((await searchParams).volver);
  if (await obtenerCuenta()) redirect(volver);
  return (
    <>
      <AccesoGoogle volver={volver} />
      <FormRegistro volver={volver} />
      <p className="border-t border-cacao/10 pt-5 text-center text-sm text-cacao/85">
        ¿Ya tienes cuenta?{" "}
        <Link href={`/cuenta/entrar?volver=${encodeURIComponent(volver)}`} className="text-cacao underline underline-offset-4 hover:text-vino">
          Entra aquí
        </Link>
      </p>
    </>
  );
}
