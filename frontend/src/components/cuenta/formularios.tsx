"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  agregarDireccion,
  borrarDireccion,
  cambiarContrasena,
  eliminarCuenta,
  entrar,
  actualizarPerfil,
  recuperar,
  reenviarVerificacion,
  registrar,
  restablecer,
  type EstadoCuenta,
} from "@/app/(tienda)/cuenta/acciones";
import { departamentos } from "@/lib/colombia";
import type { Cuenta, Direccion } from "@/lib/cuenta";
import { sinReiniciar } from "@/lib/formularios";

const INICIAL: EstadoCuenta = { errores: [] };

function Mensajes({ estado }: { estado: EstadoCuenta }) {
  if (estado.errores.length)
    return (
      <div role="alert" className="rounded-2xl bg-rosa/10 p-3 text-sm text-vino">
        {estado.errores.length === 1 ? estado.errores[0] : <ul className="list-disc pl-5">{estado.errores.map((e) => <li key={e}>{e}</li>)}</ul>}
      </div>
    );
  if (estado.ok) return <p role="status" className="rounded-2xl bg-cacao/5 p-3 text-sm text-cacao">{estado.ok}</p>;
  return null;
}

const Campo = ({ etiqueta, ayuda, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { etiqueta: string; ayuda?: string }) => (
  <label className="block">
    <span className="etiqueta">{etiqueta}</span>
    <input className="campo" {...props} />
    {ayuda && <span className="ayuda">{ayuda}</span>}
  </label>
);

const MIN = 10;

export function BotonGoogle({ volver }: { volver: string }) {
  // Enlace normal (no <Link>): la ruta redirige a Google, fuera de la tienda.
  return (
    <a href={`/cuenta/google?volver=${encodeURIComponent(volver)}`} className="boton-secundario w-full bg-white py-3">
      <svg aria-hidden viewBox="0 0 48 48" className="size-[18px]">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      Continuar con Google
    </a>
  );
}

export function FormEntrar({ volver }: { volver: string }) {
  const [estado, accion, enviando] = useActionState(entrar, INICIAL);
  return (
    <form action={accion} onSubmit={sinReiniciar(accion)} className="space-y-4">
      <input type="hidden" name="volver" value={volver} />
      <Campo etiqueta="Correo electrónico" name="email" type="email" required autoComplete="email" autoFocus />
      <Campo etiqueta="Contraseña" name="contrasena" type="password" required autoComplete="current-password" />
      <Mensajes estado={estado} />
      <button disabled={enviando} className="boton-primario w-full py-3">{enviando ? "Entrando…" : "Entrar"}</button>
      <p className="text-center text-sm">
        <Link href="/cuenta/recuperar" className="text-cacao/85 underline underline-offset-4 hover:text-vino">Olvidé mi contraseña</Link>
      </p>
    </form>
  );
}

export function FormRegistro({ volver }: { volver: string }) {
  const [estado, accion, enviando] = useActionState(registrar, INICIAL);
  return (
    <form action={accion} onSubmit={sinReiniciar(accion)} className="space-y-4">
      <input type="hidden" name="volver" value={volver} />
      <Campo etiqueta="Nombre completo" name="nombre" required minLength={3} maxLength={120} autoComplete="name" autoFocus />
      <Campo etiqueta="Correo electrónico" name="email" type="email" required autoComplete="email" />
      <Campo etiqueta="Celular (opcional)" name="telefono" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="300 123 4567" />
      <Campo etiqueta="Contraseña" name="contrasena" type="password" required minLength={MIN} maxLength={128} autoComplete="new-password" ayuda={`Mínimo ${MIN} caracteres. Una frase corta es fácil de recordar y difícil de adivinar.`} />
      <Campo etiqueta="Repite la contraseña" name="confirmar" type="password" required minLength={MIN} maxLength={128} autoComplete="new-password" />
      <label className="flex items-start gap-3 text-sm text-cacao/85">
        <input type="checkbox" name="aceptaDatos" required className="mt-0.5 size-4 shrink-0 accent-cacao" />
        <span>
          Autorizo el tratamiento de mis datos personales para gestionar mi cuenta y mis compras, según la{" "}
          <Link href="/privacidad" target="_blank" className="underline underline-offset-2">política de tratamiento de datos</Link>.
        </span>
      </label>
      <Mensajes estado={estado} />
      <button disabled={enviando} className="boton-primario w-full py-3">{enviando ? "Creando tu cuenta…" : "Crear cuenta"}</button>
    </form>
  );
}

export function FormRecuperar() {
  const [estado, accion, enviando] = useActionState(recuperar, INICIAL);
  if (estado.ok) return <Mensajes estado={estado} />;
  return (
    <form action={accion} className="space-y-4">
      <Campo etiqueta="Correo de tu cuenta" name="email" type="email" required autoComplete="email" autoFocus />
      <Mensajes estado={estado} />
      <button disabled={enviando} className="boton-primario w-full py-3">{enviando ? "Enviando…" : "Enviarme el enlace"}</button>
    </form>
  );
}

export function FormRestablecer({ token }: { token: string }) {
  const [estado, accion, enviando] = useActionState(restablecer, INICIAL);
  return (
    <form action={accion} onSubmit={sinReiniciar(accion)} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Campo etiqueta="Contraseña nueva" name="contrasena" type="password" required minLength={MIN} maxLength={128} autoComplete="new-password" autoFocus ayuda={`Mínimo ${MIN} caracteres.`} />
      <Campo etiqueta="Repite la contraseña" name="confirmar" type="password" required minLength={MIN} maxLength={128} autoComplete="new-password" />
      <Mensajes estado={estado} />
      <button disabled={enviando} className="boton-primario w-full py-3">{enviando ? "Guardando…" : "Guardar contraseña"}</button>
    </form>
  );
}

export function ReenviarVerificacion() {
  const [estado, accion, enviando] = useActionState(reenviarVerificacion, INICIAL);
  return (
    <form action={accion} className="space-y-2">
      <button disabled={enviando || !!estado.ok} className="boton-secundario bg-white">{enviando ? "Enviando…" : "Reenviar el correo"}</button>
      <Mensajes estado={estado} />
    </form>
  );
}

export function FormPerfil({ cuenta }: { cuenta: Cuenta }) {
  const [estado, accion, enviando] = useActionState(actualizarPerfil, INICIAL);
  return (
    <form action={accion} onSubmit={sinReiniciar(accion)} className="space-y-4">
      <Campo etiqueta="Nombre completo" name="nombre" required minLength={3} maxLength={120} autoComplete="name" defaultValue={cuenta.nombre} />
      <Campo etiqueta="Correo electrónico" value={cuenta.email} readOnly disabled ayuda="Es con el que entras; no se puede cambiar aquí." />
      <Campo etiqueta="Celular" name="telefono" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="300 123 4567" defaultValue={cuenta.telefono ?? ""} />
      <Mensajes estado={estado} />
      <button disabled={enviando} className="boton-primario">{enviando ? "Guardando…" : "Guardar cambios"}</button>
    </form>
  );
}

export function FormContrasena({ tieneContrasena }: { tieneContrasena: boolean }) {
  const [estado, accion, enviando] = useActionState(cambiarContrasena, INICIAL);
  return (
    <form action={accion} onSubmit={sinReiniciar(accion)} className="space-y-4">
      {tieneContrasena ? (
        <Campo etiqueta="Contraseña actual" name="actual" type="password" required autoComplete="current-password" />
      ) : (
        <p className="text-sm text-cacao/85">Entras con Google. Si quieres, crea una contraseña para entrar también con tu correo.</p>
      )}
      <Campo etiqueta="Contraseña nueva" name="nueva" type="password" required minLength={MIN} maxLength={128} autoComplete="new-password" ayuda={`Mínimo ${MIN} caracteres.`} />
      <Campo etiqueta="Repite la contraseña nueva" name="confirmar" type="password" required minLength={MIN} maxLength={128} autoComplete="new-password" />
      <Mensajes estado={estado} />
      <button disabled={enviando} className="boton-primario">{enviando ? "Guardando…" : tieneContrasena ? "Cambiar contraseña" : "Crear contraseña"}</button>
    </form>
  );
}

export function Direcciones({ direcciones }: { direcciones: Direccion[] }) {
  const [estado, accion, enviando] = useActionState(agregarDireccion, INICIAL);
  return (
    <div className="space-y-5">
      {direcciones.length === 0 ? (
        <p className="text-sm text-cacao/85">Aún no tienes direcciones guardadas. Guárdalas para no escribirlas en cada compra.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {direcciones.map((d) => (
            <li key={d.id} className="flex items-start justify-between gap-3 rounded-2xl bg-crema p-4 text-sm ring-1 ring-cacao/10">
              <span>
                <span className="block text-cacao">{d.direccion}</span>
                <span className="block text-cacao/85">{d.ciudad}, {d.departamento}</span>
                {d.indicaciones && <span className="block text-cacao/85">{d.indicaciones}</span>}
              </span>
              <form action={borrarDireccion.bind(null, d.id)}>
                <button className="text-sm text-cacao/85 underline underline-offset-4 hover:text-vino" aria-label={`Borrar la dirección ${d.direccion}`}>
                  Borrar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <details className="rounded-2xl ring-1 ring-cacao/10" open={direcciones.length === 0}>
        <summary className="cursor-pointer list-none rounded-2xl px-4 py-3 text-sm font-medium text-cacao hover:bg-cacao/5">+ Agregar dirección</summary>
        <form action={accion} onSubmit={sinReiniciar(accion)} className="grid gap-4 border-t border-cacao/10 p-4 md:grid-cols-2">
          <label>
            <span className="etiqueta">Departamento</span>
            <select name="departamento" required defaultValue="" autoComplete="address-level1" className="campo">
              <option value="" disabled>Elige…</option>
              {departamentos.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <Campo etiqueta="Ciudad o municipio" name="ciudad" required maxLength={80} autoComplete="address-level2" />
          <div className="md:col-span-2">
            <Campo etiqueta="Dirección" name="direccion" required minLength={5} maxLength={200} autoComplete="street-address" placeholder="Calle 10 # 20-30, apto 501" />
          </div>
          <div className="md:col-span-2">
            <Campo etiqueta="Indicaciones (opcional)" name="indicaciones" maxLength={200} placeholder="Barrio, torre, portería…" />
          </div>
          <div className="space-y-3 md:col-span-2">
            <Mensajes estado={estado} />
            <button disabled={enviando} className="boton-primario">{enviando ? "Guardando…" : "Guardar dirección"}</button>
          </div>
        </form>
      </details>
    </div>
  );
}

export function EliminarCuenta() {
  const [estado, accion, enviando] = useActionState(eliminarCuenta, INICIAL);
  return (
    <form action={accion} className="space-y-4">
      <p className="text-sm text-cacao/85">
        Se borran tu cuenta, tus direcciones y tus sesiones. Tus pedidos se conservan porque la ley nos obliga a guardar los
        registros de venta, pero ya no quedan ligados a una cuenta. Esta acción no se puede deshacer.
      </p>
      <Campo etiqueta="Escribe ELIMINAR para confirmar" name="confirmacion" required autoComplete="off" pattern="\s*ELIMINAR\s*" />
      <Mensajes estado={estado} />
      <button disabled={enviando} className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm text-vino ring-1 ring-vino/40 transition hover:bg-vino hover:text-white">
        {enviando ? "Eliminando…" : "Eliminar mi cuenta"}
      </button>
    </form>
  );
}
