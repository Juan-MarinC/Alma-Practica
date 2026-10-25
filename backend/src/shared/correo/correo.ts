import { Injectable, Logger } from '@nestjs/common';

export const CORREO = Symbol('Correo');

export type Mensaje = { para: string; asunto: string; html: string };

export interface Correo {
  enviar(mensaje: Mensaje): Promise<void>;
}

/** Escapa texto escrito por clientas antes de ponerlo en un correo HTML. */
export const escaparHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Adaptador con la API HTTP de Resend (sin dependencias). Sin RESEND_API_KEY solo registra que se omitió.
// Los registros nunca incluyen destinatarios ni contenido: son datos personales.
@Injectable()
export class CorreoResend implements Correo {
  private readonly log = new Logger('Correo');

  async enviar({ para, asunto, html }: Mensaje) {
    const llave = process.env.RESEND_API_KEY;
    const remitente = process.env.CORREO_REMITENTE;
    if (!llave || !remitente) {
      // Solo en desarrollo: muestra los enlaces del correo para poder probar la confirmación y la recuperación sin Resend.
      const enlaces = process.env.NODE_ENV === 'production' ? [] : [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      this.log.warn(`Correo no enviado (configura RESEND_API_KEY y CORREO_REMITENTE): "${asunto}"${enlaces.length ? ` -> ${enlaces.join(' ')}` : ''}`);
      return;
    }
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${llave}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: remitente, to: [para], subject: asunto, html }),
    });
    if (!r.ok) this.log.error(`Resend respondió ${r.status} al enviar "${asunto}"`);
  }
}
