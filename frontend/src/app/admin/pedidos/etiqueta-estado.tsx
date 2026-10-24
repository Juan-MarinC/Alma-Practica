import type { EstadoPedido } from "@/lib/admin";
import { cn } from "@/lib/format";

export const NOMBRES_ESTADO: Record<EstadoPedido, string> = {
  pendiente_pago: "Sin pagar",
  pagado: "Pagado",
  preparando: "Preparando",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const COLORES: Record<EstadoPedido, string> = {
  pendiente_pago: "bg-cacao/5 text-cacao/70",
  pagado: "bg-emerald-50 text-emerald-700",
  preparando: "bg-amber-50 text-amber-800",
  enviado: "bg-sky-50 text-sky-800",
  entregado: "bg-cacao/10 text-cacao",
  cancelado: "bg-rosa/10 text-vino",
};

export function EtiquetaEstado({ estado, pago }: { estado: EstadoPedido; pago: string | null }) {
  // Pagado pero cancelado (sin stock o cancelado antes de que llegara el pago) o monto raro: requiere acción.
  const revisar = (estado === "cancelado" && pago === "APPROVED") || pago === "MONTO_INVALIDO";
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className={cn("rounded-full px-2.5 py-1 text-xs", COLORES[estado])}>{NOMBRES_ESTADO[estado]}</span>
      {revisar && <span className="rounded-full bg-rosa px-2.5 py-1 text-xs text-white">Revisar pago / reembolsar</span>}
    </span>
  );
}
