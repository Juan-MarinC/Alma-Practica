import type { PerfilGoogle } from './cliente.js';

export const PROVEEDOR_GOOGLE = Symbol('ProveedorGoogle');

// Puerto del inicio con Google (OAuth con PKCE). El adaptador vive en infrastructure/google.
export interface ProveedorGoogle {
  configurado(): boolean;
  /** URL de Google a la que se manda a la clienta. `state` y el reto PKCE los genera la tienda. */
  urlAutorizacion(estado: string, retoPkce: string): string;
  /** Cambia el código que devuelve Google por el perfil de la clienta. */
  perfil(codigo: string, verificadorPkce: string): Promise<PerfilGoogle>;
}
