import Link from "next/link";

// notFound() del panel (producto o pedido inexistente): sin esto se usaría el 404 de la tienda, con su navbar.
export default function NoEncontradaAdmin() {
  return (
    <div className="tarjeta-admin text-center">
      <h1 className="font-serif text-3xl">No existe</h1>
      <p className="mt-2 text-sm text-cacao/70">El producto o pedido que buscas no existe o fue eliminado.</p>
      <Link href="/admin" className="boton-secundario mt-6">
        Volver al panel
      </Link>
    </div>
  );
}
