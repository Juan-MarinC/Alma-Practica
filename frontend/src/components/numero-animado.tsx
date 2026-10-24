"use client";

import { animate, useMotionValue, useTransform, motion } from "motion/react";
import { useEffect } from "react";
import { formatoPrecio } from "@/lib/format";

// Inspirado en "Animated Number" de Motion Primitives.
export function NumeroAnimado({ valor, moneda }: { valor: number; moneda?: boolean }) {
  const mv = useMotionValue(valor);
  const texto = useTransform(mv, (v) => (moneda ? formatoPrecio(Math.round(v)) : String(Math.round(v))));
  useEffect(() => {
    const control = animate(mv, valor, { type: "spring", stiffness: 120, damping: 20 });
    return () => control.stop();
  }, [mv, valor]);
  return <motion.span>{texto}</motion.span>;
}
