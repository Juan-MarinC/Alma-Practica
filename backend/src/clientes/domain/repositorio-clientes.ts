import type { ClienteGuardado, ClienteNuevo, DatosDireccion, Direccion, PedidoCliente, TipoEnlace } from './cliente.js';

export const REPOSITORIO_CLIENTES = Symbol('RepositorioClientes');

export interface RepositorioClientes {
  /** Lanza CorreoEnUso si el correo ya tiene cuenta. */
  crear(cliente: ClienteNuevo): Promise<string>;
  porId(id: string): Promise<ClienteGuardado | null>;
  porEmail(email: string): Promise<ClienteGuardado | null>;
  porGoogle(sub: string): Promise<ClienteGuardado | null>;
  /** Une la cuenta con Google; Google confirma que el correo es suyo, así que queda verificado. */
  vincularGoogle(id: string, sub: string): Promise<void>;
  actualizarPerfil(id: string, datos: { nombre: string; telefono: string | null }): Promise<void>;
  cambiarContrasena(id: string, hash: string): Promise<void>;
  marcarEmailVerificado(id: string): Promise<void>;
  /**
   * Para una cuenta cuyo correo nadie había confirmado, cuando la dueña real prueba que el correo es suyo
   * (Google o enlace de restablecer): quita contraseña, celular, direcciones, sesiones y enlaces pendientes,
   * que pudo dejar quien la creó. Conserva la cuenta y sus pedidos.
   */
  reiniciarNoVerificada(id: string, nombre: string): Promise<void>;
  /** Borra la cuenta, sus sesiones, enlaces y direcciones. Los pedidos se conservan sin el vínculo. */
  eliminar(id: string): Promise<void>;

  crearSesion(tokenHash: string, clienteId: string, expira: Date): Promise<void>;
  /** Id de la clienta si la sesión existe y no ha vencido. */
  clienteDeSesion(tokenHash: string): Promise<string | null>;
  cerrarSesion(tokenHash: string): Promise<void>;
  /** Cierra todas las sesiones de la clienta salvo, si se indica, la actual. */
  cerrarSesiones(clienteId: string, excepto?: string): Promise<void>;

  guardarEnlace(tokenHash: string, clienteId: string, tipo: TipoEnlace, expira: Date): Promise<void>;
  /**
   * Marca el enlace como usado y devuelve la clienta, solo si existe, es de ese tipo, no se ha usado, no ha vencido
   * y, si se indica `clienteId`, es de esa clienta.
   */
  usarEnlace(tokenHash: string, tipo: TipoEnlace, clienteId?: string): Promise<string | null>;

  /** Pedidos de la cuenta y, si `emailVerificado` viene, también los hechos como invitada con ese correo. */
  pedidos(clienteId: string, emailVerificado: string | null): Promise<PedidoCliente[]>;
  direcciones(clienteId: string): Promise<Direccion[]>;
  agregarDireccion(clienteId: string, datos: DatosDireccion): Promise<Direccion>;
  borrarDireccion(clienteId: string, id: number): Promise<boolean>;
}
