import type { Metadata } from "next";
import { Suspense } from "react";
import { Checkout } from "@/components/checkout";
import { leerCuenta, obtenerCuenta, type Direccion } from "@/lib/cuenta";

export const metadata: Metadata = { title: "Pagar", robots: { index: false } };

export default function PaginaCheckout() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 md:px-8">
      <h1 className="mb-8 font-serif text-4xl text-cacao md:text-5xl">Finalizar compra</h1>
      <Suspense fallback={<div className="min-h-[50vh]" />}>
        <CheckoutConCuenta />
      </Suspense>
    </div>
  );
}

// Con sesión se rellenan los datos y se ofrecen las direcciones guardadas; sin sesión es compra como invitada.
async function CheckoutConCuenta() {
  const cuenta = await obtenerCuenta();
  const direcciones = cuenta ? await leerCuenta<Direccion[]>("/yo/direcciones") : [];
  return <Checkout cuenta={cuenta && { nombre: cuenta.nombre, email: cuenta.email, telefono: cuenta.telefono }} direcciones={direcciones} />;
}
