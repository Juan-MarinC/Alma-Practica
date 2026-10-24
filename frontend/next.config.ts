import type { NextConfig } from "next";

const enProduccion = process.env.NODE_ENV === "production";

// CSP sin nonces (guía de Next): los nonces obligan a renderizar todo dinámico y no conviven con cacheComponents.
// img-src admite cualquier https porque el panel acepta fotos de cualquier dominio; form-action incluye Wompi
// porque el checkout termina en una redirección a su pasarela.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${enProduccion ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.wompi.co",
  "frame-ancestors 'none'",
  ...(enProduccion ? ["upgrade-insecure-requests"] : []),
].join("; ");

const cabecerasSeguridad = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Las URLs de pedido (/pedido/<id>) no deben filtrarse a otros sitios.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Solo en producción: en localhost (http) haría que el navegador fuerce https.
  ...(enProduccion ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: cabecerasSeguridad }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
