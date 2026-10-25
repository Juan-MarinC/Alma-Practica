import { Module } from '@nestjs/common';
import { CORREO, CorreoResend } from '../shared/correo/correo.js';
import { CerrarSesion, IniciarGoogle, IniciarSesion, RegistrarCliente, ResolverSesion, TerminarGoogle } from './application/acceso.js';
import {
  CambiarContrasena,
  ReenviarVerificacion,
  RestablecerContrasena,
  SolicitarRestablecer,
  VerificarEmail,
} from './application/contrasenas.js';
import {
  ActualizarPerfil,
  AgregarDireccion,
  BorrarDireccion,
  EliminarCuenta,
  ListarDirecciones,
  ObtenerCuenta,
  PedidosDeCliente,
} from './application/cuenta.js';
import { PROVEEDOR_GOOGLE } from './domain/proveedor-google.js';
import { REPOSITORIO_CLIENTES } from './domain/repositorio-clientes.js';
import { ProveedorGoogleOAuth } from './infrastructure/google/proveedor-google-oauth.js';
import { ClienteGuard } from './infrastructure/http/cliente.guard.js';
import { ClientesController, CuentaController } from './infrastructure/http/clientes.controller.js';
import { RepositorioClientesPostgres } from './infrastructure/postgres/repositorio-clientes-postgres.js';

@Module({
  controllers: [ClientesController, CuentaController],
  providers: [
    RegistrarCliente,
    IniciarSesion,
    CerrarSesion,
    ResolverSesion,
    IniciarGoogle,
    TerminarGoogle,
    CambiarContrasena,
    SolicitarRestablecer,
    RestablecerContrasena,
    VerificarEmail,
    ReenviarVerificacion,
    ObtenerCuenta,
    ActualizarPerfil,
    EliminarCuenta,
    PedidosDeCliente,
    ListarDirecciones,
    AgregarDireccion,
    BorrarDireccion,
    ClienteGuard,
    { provide: REPOSITORIO_CLIENTES, useClass: RepositorioClientesPostgres },
    { provide: PROVEEDOR_GOOGLE, useClass: ProveedorGoogleOAuth },
    { provide: CORREO, useClass: CorreoResend },
  ],
  // Pedidos lo usa para ligar la compra a la cuenta cuando hay sesión.
  exports: [ResolverSesion],
})
export class ClientesModule {}
