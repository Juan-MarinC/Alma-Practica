import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BotonReintentar, RefrescarMientrasPendiente, VaciarCarrito } from "@/components/estado-pedido";
import { LineasPedido, TotalesPedido } from "@/components/resumen-pedido";
import { API_URL } from "@/lib/api";
import { cn } from "@/lib/format";
import { excedeLimite, ipCliente, MINUTO } from "@/lib/limite";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };

type Resumen = {
  numero: number;
  estado: "pendiente_pago" | "pagado" | "preparando" | "enviado" | "entregado" | "cancelado";
  pagoEstado: string | null;
  lineas: { nombre: string; opciones: Record<string, string>; cantidad: number; precioUnitario: number }[];
  subtotal: number;
  costoEnvio: number;
  total: number;
  guiaEnvio: string | null;
};

const PASOS = [
  ["pagado", "Pago confirmado"],
  ["preparando", "Preparando"],
  ["enviado", "Enviado"],
  ["entregado", "Entregado"],
] as const;

async function Contenido({ params, searchParams }: PageProps<"/pedido/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // Al volver de Wompi llega ?id=<transacción>: el backend la confirma consultando a Wompi (no se confía en la URL).
  // Con límite por IP: cada verificación es una consulta a Wompi. Pasado el límite la página igual muestra el estado.
  if (typeof sp.id === "string" && !excedeLimite(`verificar:${await ipCliente()}`, 20, 10 * MINUTO)) {
    await fetch(`${API_URL}/pagos/wompi/verificar`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transaccionId: sp.id }),
      cache: "no-store",
    }).catch(() => null);
  }
  const r = await fetch(`${API_URL}/pedidos/${id}`, { cache: "no-store" });
  if (r.status === 404 || r.status === 400) notFound();
  if (!r.ok) throw new Error(`El API respondió ${r.status}`);
  const p: Resumen = await r.json();

  const rechazado = p.estado === "pendiente_pago" && ["DECLINED", "VOIDED", "ERROR"].includes(p.pagoEstado ?? "");
  const enRevision = p.estado === "pendiente_pago" && p.pagoEstado === "MONTO_INVALIDO";
  const esperando = p.estado === "pendiente_pago" && !rechazado && !enRevision;
  const pagado = !["pendiente_pago", "cancelado"].includes(p.estado);
  const paso = PASOS.findIndex(([e]) => e === p.estado);

  return (
    <>
      {esperando && <RefrescarMientrasPendiente />}
      {pagado && <VaciarCarrito />}

      <p className="text-sm text-cacao/85">Pedido #{p.numero}</p>
      <h1 className="mt-1 font-serif text-4xl text-cacao md:text-5xl">
        {pagado ? "¡Gracias por tu compra!" : rechazado ? "Tu pago no fue aprobado" : p.estado === "cancelado" ? "Pedido cancelado" : "Estamos confirmando tu pago"}
      </h1>
      <p className="mt-3 text-cacao/85" role="status">
        {pagado && "Te enviamos la confirmación a tu correo. Aquí puedes seguir el estado de tu pedido."}
        {rechazado && "No se realizó ningún cobro. Puedes intentarlo de nuevo con el mismo u otro medio de pago."}
        {esperando && "Esto puede tardar unos minutos con PSE. Esta página se actualiza sola."}
        {enRevision && "Estamos revisando tu pago y te contactaremos pronto."}
        {p.estado === "cancelado" && "Si alcanzaste a pagar, te contactaremos para hacer el reembolso."}
      </p>
      {rechazado && <BotonReintentar pedidoId={id} />}

      {pagado && (
        <ol className="mt-10 grid grid-cols-4 gap-2 text-center text-xs">
          {PASOS.map(([estado, nombre], i) => (
            <li key={estado}>
              <span className={cn("mx-auto mb-2 block h-1.5 rounded-full", i <= paso ? "bg-rosa" : "bg-cacao/10")} />
              <span className={i <= paso ? "text-cacao" : "text-cacao/85"}>{nombre}</span>
            </li>
          ))}
        </ol>
      )}
      {p.guiaEnvio && <p className="mt-6 text-sm">Número de guía: <strong>{p.guiaEnvio}</strong></p>}

      <div className="tarjeta-admin mt-10">
        <LineasPedido lineas={p.lineas} />
        <TotalesPedido subtotal={p.subtotal} envio={p.costoEnvio} total={p.total} />
      </div>
    </>
  );
}

export default function PaginaPedido(props: PageProps<"/pedido/[id]">) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-14 md:px-8">
      <Suspense fallback={<p className="text-cacao/85">Cargando tu pedido…</p>}>
        <Contenido {...props} />
      </Suspense>
    </div>
  );
}
