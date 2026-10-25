import { formatoPrecio } from "@/lib/format";

type Linea = { nombre: string; opciones: Record<string, string>; cantidad: number; precioUnitario: number };

export function LineasPedido({ lineas }: { lineas: Linea[] }) {
  return (
    <ul className="space-y-3 text-sm">
      {lineas.map((l, i) => (
        <li key={i} className="flex justify-between gap-3">
          <span>
            {l.nombre} <span className="text-cacao/85">× {l.cantidad}</span>
            {Object.keys(l.opciones).length > 0 && <span className="block text-xs text-cacao/85">{Object.values(l.opciones).join(" · ")}</span>}
          </span>
          <span className="shrink-0">{formatoPrecio(l.precioUnitario * l.cantidad)}</span>
        </li>
      ))}
    </ul>
  );
}

export function TotalesPedido({ subtotal, envio, total }: { subtotal: number; envio: number; total: number }) {
  return (
    <dl className="mt-4 space-y-1 border-t border-cacao/10 pt-4 text-sm">
      <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatoPrecio(subtotal)}</dd></div>
      <div className="flex justify-between"><dt>Envío</dt><dd>{envio === 0 ? "Gratis" : formatoPrecio(envio)}</dd></div>
      <div className="flex justify-between pt-2 text-base font-medium"><dt>Total</dt><dd>{formatoPrecio(total)}</dd></div>
    </dl>
  );
}
