import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { abrirSesionCliente, COOKIE_GOOGLE, rutaSegura } from "@/lib/cuenta";

const iguales = (a: string, b: string) =>
  timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

// Google vuelve aquí con ?code&state. Solo se acepta si `state` coincide con el de la cookie de este navegador
// (así nadie puede meter a la clienta en una cuenta ajena) y el backend cambia el código usando el verificador PKCE.
export async function GET(req: Request) {
  const fallo = NextResponse.redirect(new URL("/cuenta/entrar?error=google", req.url));
  const jarra = await cookies();
  const guardado = jarra.get(COOKIE_GOOGLE)?.value;
  jarra.delete({ name: COOKIE_GOOGLE, path: "/cuenta/google" }); // un solo uso

  let datos: { estado?: unknown; verificador?: unknown; volver?: unknown };
  try {
    datos = JSON.parse(guardado ?? "");
  } catch {
    return fallo;
  }
  const q = new URL(req.url).searchParams;
  const estado = q.get("state");
  const codigo = q.get("code");
  if (!estado || !codigo || typeof datos.estado !== "string" || typeof datos.verificador !== "string" || !iguales(estado, datos.estado))
    return fallo;

  const r = await fetch(`${API_URL}/clientes/google/fin`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ codigo, verificadorPkce: datos.verificador }),
    cache: "no-store",
  }).catch(() => null);
  const token = r?.ok ? ((await r.json()) as { token?: unknown }).token : null;
  if (typeof token !== "string") return fallo;

  await abrirSesionCliente(token);
  return NextResponse.redirect(new URL(rutaSegura(datos.volver), req.url));
}
