import { randomUUID } from 'node:crypto';
import {
  CorreoEnUso,
  type ClienteGuardado,
  type ClienteNuevo,
  type DatosDireccion,
  type Direccion,
  type PedidoCliente,
  type TipoEnlace,
} from '../../domain/cliente.js';
import type { RepositorioClientes } from '../../domain/repositorio-clientes.js';

type Fila = ClienteGuardado & { googleSub: string | null };

// Adaptador en memoria para probar los casos de uso sin base de datos.
export class RepositorioClientesMemoria implements RepositorioClientes {
  readonly clientes = new Map<string, Fila>();
  readonly sesiones = new Map<string, { clienteId: string; expira: Date }>();
  readonly enlaces = new Map<string, { clienteId: string; tipo: TipoEnlace; expira: Date; usado: boolean }>();
  readonly lista: (Direccion & { clienteId: string })[] = [];
  /** Pedidos de prueba: con dueña o como invitada (clienteId null) con un correo. */
  readonly pedidosGuardados: (PedidoCliente & { clienteId: string | null; email: string })[] = [];
  private siguienteDireccion = 1;

  private ver(f: Fila | undefined): ClienteGuardado | null {
    if (!f) return null;
    const { googleSub, ...c } = f;
    return { ...c, tieneContrasena: !!c.contrasenaHash, conGoogle: !!googleSub };
  }

  async crear(c: ClienteNuevo) {
    if ([...this.clientes.values()].some((x) => x.email === c.email)) throw new CorreoEnUso();
    const id = randomUUID();
    this.clientes.set(id, {
      id,
      nombre: c.nombre,
      email: c.email,
      telefono: c.telefono,
      contrasenaHash: c.contrasenaHash,
      googleSub: c.googleSub,
      emailVerificado: c.emailVerificado,
      tieneContrasena: !!c.contrasenaHash,
      conGoogle: !!c.googleSub,
      creadaEn: new Date().toISOString(),
    });
    return id;
  }
  async porId(id: string) {
    return this.ver(this.clientes.get(id));
  }
  async porEmail(email: string) {
    return this.ver([...this.clientes.values()].find((c) => c.email === email));
  }
  async porGoogle(sub: string) {
    return this.ver([...this.clientes.values()].find((c) => c.googleSub === sub));
  }
  async vincularGoogle(id: string, sub: string) {
    Object.assign(this.clientes.get(id)!, { googleSub: sub, emailVerificado: true });
  }
  async actualizarPerfil(id: string, datos: { nombre: string; telefono: string | null }) {
    Object.assign(this.clientes.get(id)!, datos);
  }
  async cambiarContrasena(id: string, hash: string) {
    this.clientes.get(id)!.contrasenaHash = hash;
  }
  async marcarEmailVerificado(id: string) {
    this.clientes.get(id)!.emailVerificado = true;
  }
  async reiniciarNoVerificada(id: string, nombre: string) {
    const c = this.clientes.get(id)!;
    if (c.emailVerificado) return;
    Object.assign(c, { nombre, telefono: null, contrasenaHash: null });
    this.lista.splice(0, this.lista.length, ...this.lista.filter((d) => d.clienteId !== id));
    for (const [k, s] of this.sesiones) if (s.clienteId === id) this.sesiones.delete(k);
    for (const e of this.enlaces.values()) if (e.clienteId === id) e.usado = true;
  }
  async eliminar(id: string) {
    this.clientes.delete(id);
    for (const [k, s] of this.sesiones) if (s.clienteId === id) this.sesiones.delete(k);
    for (const [k, e] of this.enlaces) if (e.clienteId === id) this.enlaces.delete(k);
    this.lista.splice(0, this.lista.length, ...this.lista.filter((d) => d.clienteId !== id));
    for (const p of this.pedidosGuardados) if (p.clienteId === id) p.clienteId = null;
  }
  async crearSesion(tokenHash: string, clienteId: string, expira: Date) {
    this.sesiones.set(tokenHash, { clienteId, expira });
  }
  async clienteDeSesion(tokenHash: string) {
    const s = this.sesiones.get(tokenHash);
    return s && s.expira > new Date() ? s.clienteId : null;
  }
  async cerrarSesion(tokenHash: string) {
    this.sesiones.delete(tokenHash);
  }
  async cerrarSesiones(clienteId: string, excepto?: string) {
    for (const [k, s] of this.sesiones) if (s.clienteId === clienteId && k !== excepto) this.sesiones.delete(k);
  }
  async guardarEnlace(tokenHash: string, clienteId: string, tipo: TipoEnlace, expira: Date) {
    for (const e of this.enlaces.values()) if (e.clienteId === clienteId && e.tipo === tipo) e.usado = true;
    this.enlaces.set(tokenHash, { clienteId, tipo, expira, usado: false });
  }
  async usarEnlace(tokenHash: string, tipo: TipoEnlace, clienteId?: string) {
    const e = this.enlaces.get(tokenHash);
    if (!e || e.tipo !== tipo || e.usado || e.expira <= new Date() || (clienteId && e.clienteId !== clienteId)) return null;
    e.usado = true;
    return e.clienteId;
  }
  async pedidos(clienteId: string, emailVerificado: string | null) {
    return this.pedidosGuardados
      .filter((p) => p.clienteId === clienteId || (emailVerificado !== null && p.clienteId === null && p.email === emailVerificado))
      .map(({ clienteId: _c, email: _e, ...p }) => p);
  }
  async direcciones(clienteId: string) {
    return this.lista.filter((d) => d.clienteId === clienteId).map(({ clienteId: _c, ...d }) => d);
  }
  async agregarDireccion(clienteId: string, d: DatosDireccion) {
    const direccion = { ...d, id: this.siguienteDireccion++ };
    this.lista.push({ ...direccion, clienteId });
    return direccion;
  }
  async borrarDireccion(clienteId: string, id: number) {
    const i = this.lista.findIndex((d) => d.id === id && d.clienteId === clienteId);
    if (i < 0) return false;
    this.lista.splice(i, 1);
    return true;
  }
}
