import type { Metadata } from "next";
import { Checkout } from "@/components/checkout";

export const metadata: Metadata = { title: "Pagar", robots: { index: false } };

export default function PaginaCheckout() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 md:px-8">
      <h1 className="mb-8 font-serif text-4xl text-cacao md:text-5xl">Finalizar compra</h1>
      <Checkout />
    </div>
  );
}
