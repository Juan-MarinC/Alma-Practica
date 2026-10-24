import Link from "next/link";
import { Suspense } from "react";
import { exigirAdmin, listarPedidosAdmin } from "@/lib/admin";
import { cn, formatoPrecio } from "@/lib/format";
import { EtiquetaEstado } from "./etiqueta-estado";

const fecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });

async function ListaPedidos() {
  await exigirAdmin();
  const pedidos = await listarPedidosAdmin();
  const porPreparar = pedidos.filter((p) => p.estado === "pagado").length;

  return (
    <>
      {porPreparar > 0 && (
        <p className="mb-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
          Tienes {porPreparar} {porPreparar === 1 ? "pedido pagado" : "pedidos pagados"} por preparar.
        </p>
      )}
      <div className="tarjeta-admin overflow-x-auto p-0">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="border-b border-cacao/10 text-left text-xs text-cacao/70">
            <tr>
              <th className="px-5 py-3 font-normal">Pedido</th>
              <th className="px-5 py-3 font-normal">Clienta</th>
              <th className="px-5 py-3 font-normal">Fecha</th>
              <th className="px-5 py-3 text-right font-normal">Total</th>
              <th className="px-5 py-3 font-normal">Estado</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id} className={cn("border-b border-cacao/5 last:border-0 hover:bg-crema", p.estado === "pendiente_pago" && "text-cacao/70")}>
                <td className="px-5 py-3">
                  <Link href={`/admin/pedidos/${p.id}`} className="font-medium hover:text-vino">#{p.numero}</Link>
                </td>
                <td className="px-5 py-3">
                  {p.cliente}
                  <span className="block text-xs text-cacao/70">{p.ciudad}</span>
                </td>
                <td className="px-5 py-3 text-cacao/70">{fecha.format(new Date(p.creadoEn))}</td>
                <td className="px-5 py-3 text-right">{formatoPrecio(p.total)}</td>
                <td className="px-5 py-3"><EtiquetaEstado estado={p.estado} pago={p.pagoEstado} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {pedidos.length === 0 && <p className="p-10 text-center text-cacao/70">Aún no hay pedidos.</p>}
      </div>
    </>
  );
}

export default function PaginaPedidos() {
  return (
    <>
      <h1 className="mb-8 font-serif text-4xl text-cacao">Pedidos</h1>
      <Suspense fallback={<p className="text-cacao/70">Cargando pedidos…</p>}>
        <ListaPedidos />
      </Suspense>
    </>
  );
}
