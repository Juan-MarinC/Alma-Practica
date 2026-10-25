import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { COOKIE_GOOGLE, rutaSegura } from "@/lib/cuenta";
import { excedeLimite, ipCliente, MINUTO } from "@/lib/limite";

// Inicio de "Continuar con Google": genera `state` (contra CSRF) y el verificador PKCE, los guarda en una cookie
// httpOnly de 10 minutos y manda a la clienta a Google. El secreto de Google solo lo conoce el backend.
export async function GET(req: Request) {
  const fallo = (motivo = "google") => NextResponse.redirect(new URL(`/cuenta/entrar?error=${motivo}`, req.url));
  if (excedeLimite(`google:${await ipCliente()}`, 20, 15 * MINUTO)) return fallo();

  const estado = randomBytes(32).toString("base64url");
  const verificador = randomBytes(32).toString("base64url");
  const reto = createHash("sha256").update(verificador).digest("base64url");
  const r = await fetch(`${API_URL}/clientes/google/inicio`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ estado, retoPkce: reto }),
    cache: "no-store",
  }).catch(() => null);
  const url = r?.ok ? ((await r.json()) as { url?: unknown }).url : null;
  if (typeof url !== "string" || !url.startsWith("https://accounts.google.com/")) return fallo();

  const volver = rutaSegura(new URL(req.url).searchParams.get("volver"));
  (await cookies()).set(COOKIE_GOOGLE, JSON.stringify({ estado, verificador, volver }), {
    httpOnly: true,
    sameSite: "lax", // tiene que llegar cuando Google redirige de vuelta
    secure: process.env.NODE_ENV === "production",
    path: "/cuenta/google",
    maxAge: 600,
  });
  return NextResponse.redirect(url);
}
