import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FormEntrar } from "@/components/cuenta/formularios";
import { AccesoGoogle, Aviso, TarjetaAcceso } from "@/components/cuenta/tarjeta-acceso";
import { obtenerCuenta, rutaSegura } from "@/lib/cuenta";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default function PaginaEntrar(props: PageProps<"/cuenta/entrar">) {
  return (
    <TarjetaAcceso titulo="Entra a tu cuenta" bajada="Mira tus pedidos y compra más rápido con tus datos guardados.">
      <Suspense fallback={<div className="h-80" />}>
        <Contenido {...props} />
      </Suspense>
    </TarjetaAcceso>
  );
}

async function Contenido({ searchParams }: PageProps<"/cuenta/entrar">) {
  const sp = await searchParams;
  const volver = rutaSegura(sp.volver);
  if (await obtenerCuenta()) redirect(volver);
  return (
    <>
      {sp.listo === "contrasena" && <Aviso>Tu contraseña nueva quedó guardada. Entra con ella.</Aviso>}
      {sp.error === "google" && <Aviso tipo="error">No pudimos entrar con Google. Intenta de nuevo o entra con tu correo.</Aviso>}
      <AccesoGoogle volver={volver} />
      <FormEntrar volver={volver} />
      <p className="border-t border-cacao/10 pt-5 text-center text-sm text-cacao/85">
        ¿No tienes cuenta?{" "}
        <Link href={`/cuenta/registro?volver=${encodeURIComponent(volver)}`} className="text-cacao underline underline-offset-4 hover:text-vino">
          Créala aquí
        </Link>
      </p>
    </>
  );
}
