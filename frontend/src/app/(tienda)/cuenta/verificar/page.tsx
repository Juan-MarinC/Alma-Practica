import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Aviso, TarjetaAcceso } from "@/components/cuenta/tarjeta-acceso";
import { apiCuenta, obtenerCuenta } from "@/lib/cuenta";

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

// Se confirma con la sesión de la propia cuenta: sin sesión se pide entrar y se vuelve aquí con el mismo enlace.
// Así abrir el enlace (o que lo abra el antivirus del correo) no le confirma la cuenta a nadie más.
async function Contenido({ searchParams }: PageProps<"/cuenta/verificar">) {
  const { token } = await searchParams;
  const valido = typeof token === "string" && /^[A-Za-z0-9_-]{20,100}$/.test(token);
  if (valido && !(await obtenerCuenta())) redirect(`/cuenta/entrar?volver=${encodeURIComponent(`/cuenta/verificar?token=${token}`)}`);
  const r = valido ? await apiCuenta("/yo/email/verificar", "POST", { token }) : null;
  return r?.ok ? (
    <>
      <Aviso>¡Listo! Tu correo quedó confirmado. En tu cuenta verás también las compras que hiciste sin iniciar sesión.</Aviso>
      <Link href="/cuenta" className="boton-primario w-full">Ir a mi cuenta</Link>
    </>
  ) : (
    <>
      <Aviso tipo="error">
        El enlace no es válido, ya se usó, venció o es de otra cuenta. Entra con la cuenta que creaste y pide uno nuevo desde ahí.
      </Aviso>
      <Link href="/cuenta" className="boton-primario w-full">Ir a mi cuenta</Link>
    </>
  );
}
