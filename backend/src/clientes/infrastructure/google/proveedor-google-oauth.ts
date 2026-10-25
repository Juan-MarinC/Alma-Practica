import { Injectable } from '@nestjs/common';
import type { PerfilGoogle } from '../../domain/cliente.js';
import type { ProveedorGoogle } from '../../domain/proveedor-google.js';

// Adaptador de "Continuar con Google" (OAuth 2.0 con PKCE). El secreto vive solo aquí, en el backend.
// El perfil se pide a Google por HTTPS con el token recién obtenido, así que no hace falta validar un JWT a mano.
// La URL de retorno sale de FRONTEND_URL (no del navegador) y debe estar registrada igual en Google Cloud.
@Injectable()
export class ProveedorGoogleOAuth implements ProveedorGoogle {
  private get config() {
    return {
      id: process.env.GOOGLE_CLIENT_ID ?? '',
      secreto: process.env.GOOGLE_CLIENT_SECRET ?? '',
      retorno: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/cuenta/google/retorno`,
    };
  }

  configurado() {
    const { id, secreto } = this.config;
    return !!id && !!secreto;
  }

  urlAutorizacion(estado: string, retoPkce: string) {
    const { id, retorno } = this.config;
    const q = new URLSearchParams({
      client_id: id,
      redirect_uri: retorno,
      response_type: 'code',
      scope: 'openid email profile',
      state: estado,
      code_challenge: retoPkce,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
  }

  async perfil(codigo: string, verificadorPkce: string): Promise<PerfilGoogle> {
    const { id, secreto, retorno } = this.config;
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: codigo,
        client_id: id,
        client_secret: secreto,
        redirect_uri: retorno,
        grant_type: 'authorization_code',
        code_verifier: verificadorPkce,
      }),
    });
    if (!r.ok) throw new Error(`Google respondió ${r.status} al cambiar el código`);
    const { access_token } = (await r.json()) as { access_token?: string };
    if (!access_token) throw new Error('Google no devolvió un token de acceso');

    const p = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${access_token}` } });
    if (!p.ok) throw new Error(`Google respondió ${p.status} al pedir el perfil`);
    const u = (await p.json()) as { sub?: unknown; email?: unknown; email_verified?: unknown; name?: unknown };
    if (typeof u.sub !== 'string' || typeof u.email !== 'string') throw new Error('Perfil de Google incompleto');
    return { sub: u.sub, email: u.email, emailVerificado: u.email_verified === true, nombre: typeof u.name === 'string' ? u.name : '' };
  }
}
