import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { salir } from "./acciones";
import { Direcciones, EliminarCuenta, FormContrasena, FormPerfil, ReenviarVerificacion } from "@/components/cuenta/formularios";
import { exigirCuenta, leerCuenta, type Direccion, type PedidoCuenta } from "@/lib/cuenta";
import { cn, formatoPrecio } from "@/lib/format";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };

const fecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" });

// Con palabras de clienta (el panel de admin usa las suyas).
const ESTADOS: Record<string, { nombre: string; color: string }> = {
  pendiente_pago: { nombre: "Pendiente de pago", color: "bg-cacao/5 text-cacao/85" },
  pagado: { nombre: "Pago recibido", color: "bg-emerald-50 text-emerald-800" },
  preparando: { nombre: "Preparando", color: "bg-amber-50 text-amber-800" },
  enviado: { nombre: "En camino", color: "bg-sky-50 text-sky-800" },
  entregado: { nombre: "Entregado", color: "bg-cacao/10 text-cacao" },
  cancelado: { nombre: "Cancelado", color: "bg-rosa/10 text-vino" },
};

export default function PaginaCuenta() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 md:px-8">
      <Suspense fallback={<p className="text-cacao/85">Cargando tu cuenta…</p>}>
        <Panel />
      </Suspense>
    </div>
  );
}

function Seccion({ id, titulo, bajada, children }: { id: string; titulo: string; bajada?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="tarjeta-admin scroll-mt-32">
      <h2 id={`${id}-titulo`} className="font-serif text-2xl">{titulo}</h2>
      {bajada && <p className="mt-1 text-sm text-cacao/85">{bajada}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

async function Panel() {
  const cuenta = await exigirCuenta("/cuenta");
  const [pedidos, direcciones] = await Promise.all([
    leerCuenta<PedidoCuenta[]>("/yo/pedidos"),
    leerCuenta<Direccion[]>("/yo/direcciones"),
  ]);

  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-cacao md:text-5xl">Hola, {cuenta.nombre.split(" ")[0]}</h1>
          <p className="mt-1 text-cacao/85">{cuenta.email}</p>
        </div>
        <form action={salir}>
          <button className="boton-secundario bg-white">Cerrar sesión</button>
        </form>
      </header>

      <nav aria-label="Secciones de la cuenta" className="mb-6 flex flex-wrap gap-2 text-sm">
        {[["pedidos", "Mis pedidos"], ["datos", "Mis datos"], ["direcciones", "Direcciones"], ["seguridad", "Seguridad"]].map(([id, nombre]) => (
          <a key={id} href={`#${id}`} className="rounded-full px-4 py-2 text-cacao/85 ring-1 ring-cacao/10 hover:text-cacao hover:ring-cacao/30">
            {nombre}
          </a>
        ))}
      </nav>

      <div className="space-y-6">
        {!cuenta.emailVerificado && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-blush/50 p-5">
            <p className="max-w-xl text-sm text-cacao">
              <strong className="font-medium">Confirma tu correo.</strong> Te enviamos un enlace a {cuenta.email}. Al confirmarlo verás aquí
              también las compras que hiciste sin iniciar sesión.
            </p>
            <ReenviarVerificacion />
          </div>
        )}

        <Seccion id="pedidos" titulo="Mis pedidos">
          {pedidos.length === 0 ? (
            <p className="text-sm text-cacao/85">
              Todavía no tienes pedidos.{" "}
              <Link href="/catalogo" className="text-cacao underline underline-offset-4 hover:text-vino">Mira el catálogo</Link>
            </p>
          ) : (
            <ul className="divide-y divide-cacao/10">
              {pedidos.map((p) => {
                const estado = ESTADOS[p.estado] ?? { nombre: p.estado, color: "bg-cacao/5 text-cacao" };
                return (
                  <li key={p.id}>
                    <Link href={`/pedido/${p.id}`} className="group flex flex-wrap items-center justify-between gap-3 py-4">
                      <span>
                        <span className="block font-medium text-cacao group-hover:text-vino">Pedido #{p.numero}</span>
                        <span className="block text-sm text-cacao/85">
                          {fecha.format(new Date(p.creadoEn))} · {p.unidades} {p.unidades === 1 ? "producto" : "productos"}
                        </span>
                      </span>
                      <span className="flex items-center gap-4">
                        <span className={cn("rounded-full px-3 py-1 text-xs", estado.color)}>{estado.nombre}</span>
                        <span className="w-24 text-right font-semibold text-cacao">{formatoPrecio(p.total)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Seccion>

        <div className="grid gap-6 md:grid-cols-2">
          <Seccion id="datos" titulo="Mis datos">
            <FormPerfil cuenta={cuenta} />
          </Seccion>
          <Seccion id="seguridad" titulo="Seguridad" bajada={cuenta.conGoogle ? "Tu cuenta está vinculada con Google: puedes entrar con ese botón." : undefined}>
            <FormContrasena tieneContrasena={cuenta.tieneContrasena} />
          </Seccion>
        </div>

        <Seccion id="direcciones" titulo="Direcciones guardadas" bajada="Las eliges en el checkout para no escribirlas cada vez.">
          <Direcciones direcciones={direcciones} />
        </Seccion>

        <details className="tarjeta-admin">
          <summary className="cursor-pointer list-none font-serif text-2xl">Eliminar mi cuenta</summary>
          <div className="mt-4">
            <EliminarCuenta />
          </div>
        </details>
      </div>
    </>
  );
}
