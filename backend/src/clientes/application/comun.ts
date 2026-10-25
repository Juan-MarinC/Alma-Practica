import { Logger } from '@nestjs/common';
import { escaparHtml, type Correo } from '../../shared/correo/correo.js';
import { DURACION_ENLACE_MS, DURACION_SESION_MS, type TipoEnlace } from '../domain/cliente.js';
import type { RepositorioClientes } from '../domain/repositorio-clientes.js';
import { hashToken, nuevoToken } from '../domain/secretos.js';

const log = new Logger('Clientes');
const urlTienda = () => process.env.FRONTEND_URL ?? 'http://localhost:3000';

/** Crea una sesión y devuelve el token para la cookie; en la base solo queda su hash. */
export async function abrirSesion(repo: RepositorioClientes, clienteId: string) {
  const token = nuevoToken();
  await repo.crearSesion(hashToken(token), clienteId, new Date(Date.now() + DURACION_SESION_MS));
  return token;
}

const CORREOS: Record<TipoEnlace, { ruta: string; asunto: string; texto: string; boton: string; vence: string }> = {
  verificar_email: {
    ruta: '/cuenta/verificar',
    asunto: 'Confirma tu correo',
    texto: 'Confirma tu correo para ver en tu cuenta también las compras que hiciste sin iniciar sesión.',
    boton: 'Confirmar mi correo',
    vence: 'El enlace vence en 48 horas.',
  },
  restablecer_contrasena: {
    ruta: '/cuenta/restablecer',
    asunto: 'Restablece tu contraseña',
    texto: 'Recibimos una solicitud para crear una contraseña nueva. Si no fuiste tú, ignora este correo: tu cuenta sigue igual.',
    boton: 'Crear contraseña nueva',
    vence: 'El enlace vence en 30 minutos y solo sirve una vez.',
  },
};

/** Guarda un enlace de un solo uso y lo envía por correo. Un fallo del correo no tumba la operación. */
export async function enviarEnlace(repo: RepositorioClientes, correo: Correo, cliente: { id: string; nombre: string; email: string }, tipo: TipoEnlace) {
  const token = nuevoToken();
  await repo.guardarEnlace(hashToken(token), cliente.id, tipo, new Date(Date.now() + DURACION_ENLACE_MS[tipo]));
  const c = CORREOS[tipo];
  const url = `${urlTienda()}${c.ruta}?token=${token}`;
  try {
    await correo.enviar({
      para: cliente.email,
      asunto: c.asunto,
      html:
        `<div style="font-family:sans-serif;color:#3d2b2b;max-width:520px">` +
        `<h2>Hola, ${escaparHtml(cliente.nombre.split(' ')[0])}</h2><p>${c.texto}</p>` +
        `<p><a href="${url}" style="display:inline-block;background:#3d2b2b;color:#fbf7f4;padding:12px 22px;border-radius:999px;text-decoration:none">${c.boton}</a></p>` +
        `<p style="font-size:13px;color:#6b5757">${c.vence}</p></div>`,
    });
  } catch (e) {
    log.error(`No se pudo enviar el correo "${c.asunto}": ${(e as Error).message}`);
  }
}
