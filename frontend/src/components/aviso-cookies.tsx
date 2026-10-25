"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CLAVE = "alma-aviso-cookies-v1";

// Aviso informativo: la tienda solo guarda lo esencial (la bolsa), así que no hace falta aceptar o rechazar.
// Si se agrega analítica o pixeles, esto debe pasar a un banner con consentimiento previo a cargar esos scripts.
export function AvisoCookies() {
  const [visible, setVisible] = useState(false);

  // Se lee después de montar para no romper la hidratación; sin almacenamiento disponible no se muestra.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(localStorage.getItem(CLAVE) !== "visto");
    } catch {}
  }, []);

  if (!visible) return null;

  function cerrar() {
    try {
      localStorage.setItem(CLAVE, "visto");
    } catch {}
    setVisible(false);
  }

  return (
    <section
      aria-label="Aviso de cookies"
      className="aparecer fixed inset-x-3 bottom-3 z-40 flex flex-col gap-3 rounded-2xl bg-white/95 p-4 text-sm text-cacao ring-1 ring-cacao/10 backdrop-blur sm:right-auto sm:left-5 sm:max-w-sm sm:flex-row sm:items-center"
    >
      <p className="text-cacao/85">
        Solo guardamos lo necesario para tu bolsa y tu sesión; no usamos cookies de publicidad.{" "}
        <Link href="/privacidad#cookies" className="underline underline-offset-2 hover:text-vino">
          Más información
        </Link>
      </p>
      <button onClick={cerrar} className="boton-primario shrink-0">
        Entendido
      </button>
    </section>
  );
}
