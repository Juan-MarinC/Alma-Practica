"use client";

import { MotionConfig } from "motion/react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

// Copia de lo que se muestra en la bolsa. El precio y el stock definitivos los valida el backend al pagar (paso 3).
export type ItemCarrito = {
  slug: string;
  sku: string;
  cantidad: number;
  nombre: string;
  detalle: string;
  precio: number;
  stock: number;
  categoria: string;
  tono: [string, string];
  imagen?: string;
};

type Ctx = {
  items: ItemCarrito[];
  /** false hasta leer el carrito guardado en este navegador. */
  listo: boolean;
  abierto: boolean;
  abrir: () => void;
  cerrar: () => void;
  agregar: (item: Omit<ItemCarrito, "cantidad">) => void;
  cambiarCantidad: (sku: string, cantidad: number) => void;
  vaciar: () => void;
  cantidadTotal: number;
  subtotal: number;
};

const CarritoContext = createContext<Ctx | null>(null);
const CLAVE = "alma-carrito-v2";

const esItem = (i: Partial<ItemCarrito>): i is ItemCarrito =>
  typeof i?.sku === "string" && typeof i.nombre === "string" && typeof i.precio === "number" && typeof i.cantidad === "number";

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [listo, setListo] = useState(false);
  const cargado = useRef(false);

  // El carrito guardado se lee después de montar para no romper la hidratación del HTML del servidor.
  useEffect(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(guardado)) setItems(guardado.filter(esItem));
    } catch {}
    setListo(true);
  }, []);

  useEffect(() => {
    // El primer render trae el carrito vacío: no se guarda para no borrar lo que había.
    if (!cargado.current) {
      cargado.current = true;
      return;
    }
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items));
    } catch {}
  }, [items]);

  const valor = useMemo<Ctx>(
    () => ({
      items,
      listo,
      abierto,
      abrir: () => setAbierto(true),
      cerrar: () => setAbierto(false),
      agregar: (nuevo) => {
        setItems((prev) => {
          const existe = prev.find((i) => i.sku === nuevo.sku);
          return existe
            ? prev.map((i) => (i.sku === nuevo.sku ? { ...nuevo, cantidad: Math.min(i.cantidad + 1, nuevo.stock) } : i))
            : [...prev, { ...nuevo, cantidad: 1 }];
        });
        setAbierto(true);
      },
      cambiarCantidad: (sku, cantidad) =>
        setItems((prev) =>
          cantidad <= 0 ? prev.filter((i) => i.sku !== sku) : prev.map((i) => (i.sku === sku ? { ...i, cantidad } : i)),
        ),
      vaciar: () => setItems([]),
      cantidadTotal: items.reduce((s, i) => s + i.cantidad, 0),
      subtotal: items.reduce((s, i) => s + i.precio * i.cantidad, 0),
    }),
    [items, listo, abierto],
  );

  return (
    <CarritoContext.Provider value={valor}>
      {/* Las animaciones de Motion respetan "reducir movimiento" del sistema. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de CarritoProvider");
  return ctx;
}
