import { Suspense } from "react";
import { FormProducto } from "@/components/admin/form-producto";
import { exigirAdmin } from "@/lib/admin";
import { guardarProducto } from "../../acciones";

async function Formulario() {
  await exigirAdmin();
  return (
    <FormProducto
      esNuevo
      accion={guardarProducto.bind(null, null)}
      inicial={{
        slug: "",
        nombre: "",
        descripcion: "",
        categoria: "ropa",
        precio: "",
        precioAntes: "",
        nuevo: true,
        activo: true,
        atributos: "",
        imagenes: "",
        variantes: [{ sku: "", opciones: "", precio: "", stock: "0", stockAnterior: "" }],
      }}
    />
  );
}

export default function PaginaNuevo() {
  return (
    <>
      <h1 className="mb-8 font-serif text-4xl text-cacao">Nuevo producto</h1>
      <Suspense fallback={null}>
        <Formulario />
      </Suspense>
    </>
  );
}
