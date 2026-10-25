import { Inject, Injectable } from '@nestjs/common';
import { aCuenta, DatosInvalidos, MAX_DIRECCIONES, SesionInvalida, validarDireccion, validarPerfil } from '../domain/cliente.js';
import { REPOSITORIO_CLIENTES, type RepositorioClientes } from '../domain/repositorio-clientes.js';

async function cuentaDe(repo: RepositorioClientes, id: string) {
  const cliente = await repo.porId(id);
  if (!cliente) throw new SesionInvalida();
  return cliente;
}

@Injectable()
export class ObtenerCuenta {
  constructor(@Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes) {}

  async ejecutar(clienteId: string) {
    return aCuenta(await cuentaDe(this.repo, clienteId));
  }
}

@Injectable()
export class ActualizarPerfil {
  constructor(@Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes) {}

  /** Nombre y celular. El correo no se cambia aquí: es con lo que se entra y se confirma. */
  async ejecutar(clienteId: string, datos: unknown) {
    const perfil = validarPerfil(datos);
    await cuentaDe(this.repo, clienteId);
    await this.repo.actualizarPerfil(clienteId, perfil);
    return aCuenta(await cuentaDe(this.repo, clienteId));
  }
}

@Injectable()
export class EliminarCuenta {
  constructor(@Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes) {}

  /** Derecho de supresión (Ley 1581). Se pide escribir ELIMINAR para evitar borrados por error. */
  async ejecutar(clienteId: string, datos: unknown) {
    const confirmacion = (datos as { confirmacion?: unknown } | null)?.confirmacion;
    if (confirmacion !== 'ELIMINAR') throw new DatosInvalidos(['Escribe ELIMINAR para confirmar']);
    await cuentaDe(this.repo, clienteId);
    await this.repo.eliminar(clienteId);
  }
}

@Injectable()
export class PedidosDeCliente {
  constructor(@Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes) {}

  /** Las compras como invitada con su correo solo aparecen cuando el correo está confirmado. */
  async ejecutar(clienteId: string) {
    const cliente = await cuentaDe(this.repo, clienteId);
    return this.repo.pedidos(clienteId, cliente.emailVerificado ? cliente.email : null);
  }
}

@Injectable()
export class ListarDirecciones {
  constructor(@Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes) {}

  ejecutar(clienteId: string) {
    return this.repo.direcciones(clienteId);
  }
}

@Injectable()
export class AgregarDireccion {
  constructor(@Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes) {}

  async ejecutar(clienteId: string, datos: unknown) {
    const direccion = validarDireccion(datos);
    if ((await this.repo.direcciones(clienteId)).length >= MAX_DIRECCIONES)
      throw new DatosInvalidos([`Puedes guardar hasta ${MAX_DIRECCIONES} direcciones; borra una para agregar otra`]);
    return this.repo.agregarDireccion(clienteId, direccion);
  }
}

@Injectable()
export class BorrarDireccion {
  constructor(@Inject(REPOSITORIO_CLIENTES) private readonly repo: RepositorioClientes) {}

  /** Solo borra si la dirección es de esta clienta. */
  ejecutar(clienteId: string, id: number) {
    return this.repo.borrarDireccion(clienteId, id);
  }
}
