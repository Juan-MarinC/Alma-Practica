"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { crearPedido } from "@/app/(tienda)/checkout/acciones";
import { departamentos } from "@/lib/colombia";
import { tienda } from "@/lib/config";
import type { Direccion } from "@/lib/cuenta";
import { formatoPrecio } from "@/lib/format";
import { sinReiniciar } from "@/lib/formularios";
import { useCarrito } from "./carrito";

type DatosCuenta = { nombre: string; email: string; telefono: string | null };

// Checkout sobrio: sin animaciones, para no distraer al pagar.
export function Checkout({ cuenta = null, direcciones = [] }: { cuenta?: DatosCuenta | null; direcciones?: Direccion[] }) {
  const { items, subtotal, listo } = useCarrito();
  const [estado, enviar, enviando] = useActionState(crearPedido, { errores: [] });
  const [elegida, setElegida] = useState<number | "nueva">(direcciones[0]?.id ?? "nueva");
  const dir = direcciones.find((d) => d.id === elegida);
  const envio = subtotal >= tienda.envioGratisDesde ? 0 : tienda.envioFijo;

  if (!listo) return <div className="min-h-[50vh]" />;
  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-cacao/85">Tu bolsa está vacía.</p>
        <Link href="/catalogo" className="mt-4 inline-block text-sm text-vino underline underline-offset-4">Ver productos</Link>
      </div>
    );
  }

  return (
    <form action={enviar} onSubmit={sinReiniciar(enviar)} className="grid gap-10 md:grid-cols-[1fr_22rem]">
      <div className="space-y-8">
        {estado.errores.length > 0 && (
          <div role="alert" className="rounded-2xl bg-rosa/10 p-4 text-sm text-vino">
            <ul className="list-disc pl-5">{estado.errores.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
        )}

        <p className="rounded-2xl bg-cacao/5 px-4 py-3 text-sm text-cacao/85">
          {cuenta ? (
            <>Compras con tu cuenta ({cuenta.email}). El pedido quedará en <Link href="/cuenta#pedidos" className="underline underline-offset-2">Mis pedidos</Link>.</>
          ) : (
            <>
              ¿Tienes cuenta?{" "}
              <Link href="/cuenta/entrar?volver=/checkout" className="text-cacao underline underline-offset-2">Entra</Link> para usar tus datos y
              direcciones guardadas, o sigue como invitada.
            </>
          )}
        </p>

        <fieldset className="tarjeta-admin">
          <legend className="float-left mb-5 w-full font-serif text-2xl">Tus datos</legend>
          <div className="clear-left grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="etiqueta">Nombre completo</span>
            <input name="nombre" required minLength={3} maxLength={120} autoComplete="name" defaultValue={cuenta?.nombre} className="campo" />
          </label>
          <label>
            <span className="etiqueta">Correo electrónico</span>
            <input name="email" type="email" required autoComplete="email" defaultValue={cuenta?.email} className="campo" />
            <span className="ayuda">Aquí te llega la confirmación del pedido.</span>
          </label>
          <label>
            <span className="etiqueta">Celular</span>
            <input name="telefono" type="tel" required inputMode="tel" autoComplete="tel-national" placeholder="300 123 4567" defaultValue={cuenta?.telefono ?? undefined} className="campo" />
            <span className="ayuda">Para coordinar la entrega.</span>
          </label>
          </div>
        </fieldset>

        <fieldset className="tarjeta-admin">
          <legend className="float-left mb-5 w-full font-serif text-2xl">Dirección de envío</legend>
          {direcciones.length > 0 && (
            <label className="clear-left mb-4 block">
              <span className="etiqueta">Usar una dirección guardada</span>
              <select value={String(elegida)} onChange={(e) => setElegida(e.target.value === "nueva" ? "nueva" : Number(e.target.value))} className="campo">
                {direcciones.map((d) => <option key={d.id} value={d.id}>{d.direccion}, {d.ciudad}</option>)}
                <option value="nueva">Otra dirección…</option>
              </select>
            </label>
          )}
          {/* key: al cambiar de dirección guardada los campos se vuelven a llenar con sus datos. */}
          <div key={String(elegida)} className="clear-left grid gap-4 md:grid-cols-2">
          <label>
            <span className="etiqueta">Departamento</span>
            <select name="departamento" required defaultValue={dir?.departamento ?? ""} autoComplete="address-level1" className="campo">
              <option value="" disabled>Elige…</option>
              {departamentos.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label>
            <span className="etiqueta">Ciudad o municipio</span>
            <input name="ciudad" required maxLength={80} autoComplete="address-level2" defaultValue={dir?.ciudad} className="campo" />
          </label>
          <label className="md:col-span-2">
            <span className="etiqueta">Dirección</span>
            <input name="direccion" required minLength={5} maxLength={200} autoComplete="street-address" placeholder="Calle 10 # 20-30, apto 501" defaultValue={dir?.direccion} className="campo" />
          </label>
          <label className="md:col-span-2">
            <span className="etiqueta">Indicaciones (opcional)</span>
            <input name="indicaciones" maxLength={200} placeholder="Barrio, torre, portería…" defaultValue={dir?.indicaciones} className="campo" />
          </label>
          {cuenta && elegida === "nueva" && (
            <label className="flex items-center gap-3 text-sm text-cacao/85 md:col-span-2">
              <input type="checkbox" name="guardarDireccion" defaultChecked className="size-4 accent-cacao" />
              Guardar esta dirección en mi cuenta
            </label>
          )}
          </div>
        </fieldset>

        <label className="flex items-start gap-3 text-sm text-cacao/80">
          <input type="checkbox" name="aceptaDatos" required className="mt-0.5 size-4 shrink-0 accent-cacao" />
          <span>
            Autorizo el tratamiento de mis datos personales para gestionar mi compra, según la{" "}
            <Link href="/privacidad" target="_blank" className="underline underline-offset-2">política de tratamiento de datos</Link>.
          </span>
        </label>
      </div>

      <aside className="tarjeta-admin h-fit md:sticky md:top-28">
        <h2 className="mb-4 font-serif text-2xl">Tu pedido</h2>
        <ul className="space-y-3 text-sm">
          {items.map((i) => (
            <li key={i.sku} className="flex justify-between gap-3">
              <input type="hidden" name="sku" value={i.sku} />
              <input type="hidden" name="cantidad" value={i.cantidad} />
              <span>
                {i.nombre} <span className="text-cacao/85">× {i.cantidad}</span>
                {i.detalle && <span className="block text-xs text-cacao/85">{i.detalle}</span>}
              </span>
              <span className="shrink-0">{formatoPrecio(i.precio * i.cantidad)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-cacao/10 pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatoPrecio(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Envío</dt><dd>{envio === 0 ? "Gratis" : formatoPrecio(envio)}</dd></div>
          <div className="flex justify-between pt-2 text-base font-medium"><dt>Total</dt><dd>{formatoPrecio(subtotal + envio)}</dd></div>
        </dl>
        <button disabled={enviando} className="boton-primario mt-6 w-full py-3.5">
          <Lock className="size-4" /> {enviando ? "Preparando el pago…" : "Pagar con Wompi"}
        </button>
        <p className="mt-3 text-center text-xs text-cacao/85">PSE, Nequi, tarjetas y Bancolombia. El total final se confirma en el pago.</p>
      </aside>
    </form>
  );
}
