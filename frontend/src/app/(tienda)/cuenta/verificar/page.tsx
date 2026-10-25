import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Aviso, TarjetaAcceso } from "@/components/cuenta/tarjeta-acceso";
import { apiCuenta } from "@/lib/cuenta";

export const metadata: Metadata = { title: "Confirmar correo", robots: { index: false } };

export default function PaginaVerificar(props: PageProps<"/cuenta/verificar">) {
  return (
    <TarjetaAcceso titulo="Confirmar tu correo">
      <Suspense fallback={<p className="text-cacao/85">Confirmando…</p>}>
        <Contenido {...props} />
      </Suspense>
    </TarjetaAcceso>
  );
}

// Se confirma al abrir el enlace del correo. Si un antivirus del correo lo abre antes, solo deja el correo confirmado.
async function Contenido({ searchParams }: PageProps<"/cuenta/verificar">) {
  const { token } = await searchParams;
  const r = typeof token === "string" && token ? await apiCuenta("/email/verificar", "POST", { token }) : null;
  return r?.ok ? (
    <>
      <Aviso>¡Listo! Tu correo quedó confirmado. En tu cuenta verás también las compras que hiciste sin iniciar sesión.</Aviso>
      <Link href="/cuenta" className="boton-primario w-full">Ir a mi cuenta</Link>
    </>
  ) : (
    <>
      <Aviso tipo="error">El enlace no es válido, ya se usó o venció. Desde tu cuenta puedes pedir uno nuevo.</Aviso>
      <Link href="/cuenta" className="boton-primario w-full">Ir a mi cuenta</Link>
    </>
  );
}
