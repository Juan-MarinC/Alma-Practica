import { startTransition, type FormEvent } from "react";

// React 19 vacía el formulario después de una `action`. Si el servidor devuelve errores se perdería lo escrito;
// enviando así (con JS) no se reinicia. Sin JS el formulario sigue funcionando con su `action`.
export const sinReiniciar = (accion: (datos: FormData) => void) => (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const datos = new FormData(e.currentTarget);
  startTransition(() => accion(datos));
};
