import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormEstadoPedido } from "@/components/admin/form-estado-pedido";
import { exigirAdmin, obtenerPedidoAdmin } from "@/lib/admin";
import { LineasPedido, TotalesPedido } from "@/components/resumen-pedido";
import { cambiarEstadoPedido } from "../../acciones";
import { EtiquetaEstado } from "../etiqueta-estado";

const fecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota" });

async function Detalle({ params }: { params: PageProps<"/admin/pedidos/[id]">["params"] }) {
  await exigirAdmin();
  const { id } = await params;
  const p = await obtenerPedidoAdmin(id);
  if (!p) notFound();

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <h1 className="font-serif text-4xl text-cacao">Pedido #{p.numero}</h1>
        <EtiquetaEstado estado={p.estado} pago={p.pago?.estado ?? null} />
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="tarjeta-admin">
            <h2 className="mb-4 font-serif text-2xl">Productos</h2>
            <LineasPedido lineas={p.lineas} />
            <TotalesPedido subtotal={p.subtotal} envio={p.costoEnvio} total={p.total} />
          </section>

          <section className="tarjeta-admin grid gap-6 text-sm sm:grid-cols-2">
            <div>
              <h2 className="mb-2 font-serif text-xl">Clienta</h2>
              <p>{p.contacto.nombre}</p>
              <p><a href={`mailto:${p.contacto.email}`} className="underline underline-offset-2">{p.contacto.email}</a></p>
              <p>{p.contacto.telefono}</p>
              <p className="mt-2 text-xs text-cacao/70">Autorizó el tratamiento de datos el {fecha.format(new Date(p.contacto.aceptaDatosEn))}</p>
            </div>
            <div>
              <h2 className="mb-2 font-serif text-xl">Envío</h2>
              <p>{p.envio.direccion}</p>
              {p.envio.indicaciones && <p className="text-cacao/70">{p.envio.indicaciones}</p>}
              <p>{p.envio.ciudad}, {p.envio.departamento}</p>
              {p.guiaEnvio && <p className="mt-2">Guía: <strong>{p.guiaEnvio}</strong></p>}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="tarjeta-admin text-sm">
            <h2 className="mb-2 font-serif text-xl">Pago</h2>
            {p.pago ? (
              <>
                <p>Estado: <strong>{p.pago.estado}</strong></p>
                {p.pago.metodo && <p>Medio: {p.pago.metodo}</p>}
                <p className="mt-1 font-mono text-xs text-cacao/70">{p.pago.referencia}</p>
              </>
            ) : (
              <p className="text-cacao/70">Sin intento de pago.</p>
            )}
            <p className="mt-2 text-xs text-cacao/70">Creado el {fecha.format(new Date(p.creadoEn))}</p>
          </section>
          <FormEstadoPedido key={p.estado} estado={p.estado} accion={cambiarEstadoPedido.bind(null, p.id)} />
        </aside>
      </div>
    </>
  );
}

export default function PaginaPedidoAdmin({ params }: PageProps<"/admin/pedidos/[id]">) {
  return (
    <Suspense fallback={<p className="text-cacao/70">Cargando…</p>}>
      <Detalle params={params} />
    </Suspense>
  );
}
