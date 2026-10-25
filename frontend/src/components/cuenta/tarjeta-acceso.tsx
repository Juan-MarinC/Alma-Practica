import Link from "next/link";
import { BotonGoogle } from "./formularios";

// Marco común de entrar / crear cuenta / recuperar: título, bajada y la tarjeta del formulario.
export function TarjetaAcceso({ titulo, bajada, children }: { titulo: string; bajada?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <h1 className="font-serif text-4xl text-cacao">{titulo}</h1>
      {bajada && <p className="mt-2 text-cacao/85">{bajada}</p>}
      <div className="tarjeta-admin mt-8 space-y-5">{children}</div>
    </div>
  );
}

/** Botón de Google + aviso de la política + separador "o con tu correo". */
export function AccesoGoogle({ volver }: { volver: string }) {
  return (
    <>
      <BotonGoogle volver={volver} />
      <p className="text-center text-xs text-cacao/85">
        Al continuar con Google aceptas la{" "}
        <Link href="/privacidad" target="_blank" className="underline underline-offset-2">política de tratamiento de datos</Link>.
      </p>
      <div className="flex items-center gap-3 text-xs text-cacao/85">
        <span className="h-px flex-1 bg-cacao/10" />o con tu correo<span className="h-px flex-1 bg-cacao/10" />
      </div>
    </>
  );
}

export function Aviso({ tipo = "ok", children }: { tipo?: "ok" | "error"; children: React.ReactNode }) {
  return tipo === "error" ? (
    <p role="alert" className="rounded-2xl bg-rosa/10 p-3 text-sm text-vino">{children}</p>
  ) : (
    <p role="status" className="rounded-2xl bg-cacao/5 p-3 text-sm text-cacao">{children}</p>
  );
}
