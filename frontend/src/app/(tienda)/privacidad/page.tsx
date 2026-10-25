import type { Metadata } from "next";
import { tienda } from "@/lib/config";

export const metadata: Metadata = { title: "Tratamiento de datos personales" };

// shortcut: plantilla base (Ley 1581 de 2012). Completa los datos del responsable y hazla revisar por un abogado antes de lanzar.
export default function PaginaPrivacidad() {
  return (
    <article className="mx-auto max-w-2xl space-y-5 px-5 py-14 leading-relaxed text-cacao/80 md:px-8">
      <h1 className="font-serif text-4xl text-cacao">Política de tratamiento de datos personales</h1>
      <p>
        {tienda.nombre} es responsable del tratamiento de los datos personales que nos entregas al comprar en esta tienda, de acuerdo
        con la Ley 1581 de 2012 y el Decreto 1377 de 2013.
      </p>
      <h2 className="font-serif text-2xl text-cacao">Qué datos recogemos y para qué</h2>
      <p>
        Nombre, correo, celular y dirección de envío. Los usamos solo para procesar tu pedido, enviarlo, informarte su estado y
        atender cambios o reembolsos. Los pagos los procesa Wompi: nosotros no vemos ni guardamos los datos de tu tarjeta o cuenta.
      </p>
      <h2 id="cuenta" className="scroll-mt-32 font-serif text-2xl text-cacao">Si creas una cuenta</h2>
      <p>
        Crear una cuenta es opcional. Si la creas guardamos tu nombre, correo, celular (si lo das), tus direcciones guardadas y tu
        contraseña, que se almacena cifrada de forma irreversible: nadie en la tienda puede verla. Si entras con Google, Google nos
        comparte tu nombre, tu correo y un identificador de tu cuenta de Google; no recibimos tu contraseña de Google. Usamos estos
        datos solo para que entres, veas tus pedidos y compres más rápido.
      </p>
      <p>
        Puedes corregir tus datos o eliminar tu cuenta cuando quieras desde «Mi cuenta». Al eliminarla borramos tu cuenta, tus
        direcciones y tus sesiones; los pedidos se conservan porque la ley nos obliga a guardar los registros de venta, pero dejan de
        estar ligados a una cuenta.
      </p>
      <h2 className="font-serif text-2xl text-cacao">Con quién los compartimos</h2>
      <p>Solo con la pasarela de pagos y la transportadora que entrega tu pedido, en lo necesario para cumplir la compra.</p>
      <h2 className="font-serif text-2xl text-cacao">Tus derechos</h2>
      <p>
        Puedes conocer, actualizar, rectificar y pedir la supresión de tus datos, o revocar esta autorización, escribiéndonos por los
        canales de contacto de la tienda.
      </p>
      <h2 id="cookies" className="scroll-mt-32 font-serif text-2xl text-cacao">Cookies y almacenamiento en tu navegador</h2>
      <p>No usamos cookies de analítica, publicidad ni seguimiento. Solo guardamos en tu navegador lo necesario para que la tienda funcione:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="font-medium text-cacao">Tu bolsa de compras:</strong> los productos que agregas (referencia, nombre, precio y
          cantidad) se guardan en el almacenamiento local de tu navegador para que no se pierdan al recargar. No nos llegan hasta que
          finalizas la compra y se quedan ahí hasta que vacías la bolsa o borras los datos del sitio.
        </li>
        <li>
          <strong className="font-medium text-cacao">Tu sesión:</strong> si entras a tu cuenta, una cookie segura (no accesible desde
          el navegador) te mantiene dentro hasta 30 días o hasta que cierres sesión. Mientras entras con Google se usa otra por 10
          minutos para comprobar que la respuesta de Google es para ti.
        </li>
        <li>
          <strong className="font-medium text-cacao">El aviso de cookies:</strong> recordamos que ya lo viste para no mostrártelo de
          nuevo.
        </li>
        <li>
          <strong className="font-medium text-cacao">Panel de administración:</strong> usa una cookie de sesión solo para quien administra
          la tienda; no afecta a quienes compran.
        </li>
      </ul>
      <p>
        Algunos servicios externos reciben datos técnicos de tu navegador (como tu dirección IP) al usarlos: las fotos de los productos se
        cargan desde Unsplash, el pago ocurre en Wompi y el inicio con Google ocurre en Google, cada uno con su propia política de
        privacidad.
      </p>
      <p>
        Puedes borrar esta información cuando quieras desde la configuración de tu navegador (datos del sitio). Si en el futuro usamos
        herramientas de analítica o publicidad, te pediremos tu autorización antes de activarlas.
      </p>
      <p className="rounded-2xl bg-blush/40 p-4 text-sm">
        Pendiente de completar por la tienda: razón social o nombre del responsable, NIT o cédula, dirección y correo de contacto
        para consultas y reclamos.
      </p>
    </article>
  );
}
