import { departamentos } from "@/lib/colombia";
import type { Direccion } from "@/lib/cuenta";

/** Campos de dirección de envío del checkout y de "Mis direcciones". Van dentro de una grilla de 2 columnas. */
export function CamposDireccion({ inicial }: { inicial?: Direccion }) {
  return (
    <>
      <label>
        <span className="etiqueta">Departamento</span>
        <select name="departamento" required defaultValue={inicial?.departamento ?? ""} autoComplete="address-level1" className="campo">
          <option value="" disabled>Elige…</option>
          {departamentos.map((d) => <option key={d}>{d}</option>)}
        </select>
      </label>
      <label>
        <span className="etiqueta">Ciudad o municipio</span>
        <input name="ciudad" required maxLength={80} autoComplete="address-level2" defaultValue={inicial?.ciudad} className="campo" />
      </label>
      <label className="md:col-span-2">
        <span className="etiqueta">Dirección</span>
        <input name="direccion" required minLength={5} maxLength={200} autoComplete="street-address" placeholder="Calle 10 # 20-30, apto 501" defaultValue={inicial?.direccion} className="campo" />
      </label>
      <label className="md:col-span-2">
        <span className="etiqueta">Indicaciones (opcional)</span>
        <input name="indicaciones" maxLength={200} placeholder="Barrio, torre, portería…" defaultValue={inicial?.indicaciones} className="campo" />
      </label>
    </>
  );
}
