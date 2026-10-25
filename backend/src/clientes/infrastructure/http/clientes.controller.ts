import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { CerrarSesion, IniciarGoogle, IniciarSesion, RegistrarCliente, TerminarGoogle } from '../../application/acceso.js';
import {
  CambiarContrasena,
  ReenviarVerificacion,
  RestablecerContrasena,
  SolicitarRestablecer,
  VerificarEmail,
} from '../../application/contrasenas.js';
import {
  ActualizarPerfil,
  AgregarDireccion,
  BorrarDireccion,
  EliminarCuenta,
  ListarDirecciones,
  ObtenerCuenta,
  PedidosDeCliente,
} from '../../application/cuenta.js';
import {
  CorreoEnUso,
  CredencialesInvalidas,
  DatosInvalidos,
  DemasiadosIntentos,
  EnlaceInvalido,
  GoogleNoConfigurado,
  SesionInvalida,
} from '../../domain/cliente.js';
import { ClienteActual, ClienteGuard, tokenBearer, type ClienteEnSesion } from './cliente.guard.js';

function aHttp(e: unknown): never {
  if (e instanceof DatosInvalidos) throw new UnprocessableEntityException({ errores: e.errores });
  if (e instanceof CredencialesInvalidas) throw new UnauthorizedException({ errores: ['Correo o contraseña incorrectos'] });
  if (e instanceof CorreoEnUso)
    throw new ConflictException({ errores: ['Ya existe una cuenta con ese correo. Entra o recupera tu contraseña.'] });
  if (e instanceof EnlaceInvalido) throw new BadRequestException({ errores: ['El enlace no es válido, ya se usó o venció. Pide uno nuevo.'] });
  if (e instanceof DemasiadosIntentos)
    throw new HttpException({ errores: ['Demasiados intentos. Espera unos minutos e intenta de nuevo.'] }, 429);
  if (e instanceof GoogleNoConfigurado) throw new ServiceUnavailableException({ errores: ['El inicio con Google no está disponible.'] });
  if (e instanceof SesionInvalida) throw new UnauthorizedException();
  throw e;
}

@Controller('clientes')
export class ClientesController {
  constructor(
    private readonly registrar: RegistrarCliente,
    private readonly iniciar: IniciarSesion,
    private readonly cerrar: CerrarSesion,
    private readonly iniciarGoogle: IniciarGoogle,
    private readonly terminarGoogle: TerminarGoogle,
    private readonly solicitarRestablecer: SolicitarRestablecer,
    private readonly restablecer: RestablecerContrasena,
  ) {}

  @Post('registro')
  @HttpCode(201)
  async crearCuenta(@Body() datos: unknown) {
    return { token: await this.registrar.ejecutar(datos).catch(aHttp) };
  }

  @Post('sesion')
  @HttpCode(200)
  async entrar(@Body() datos: unknown) {
    return { token: await this.iniciar.ejecutar(datos).catch(aHttp) };
  }

  @Delete('sesion')
  @HttpCode(204)
  async salir(@Headers('authorization') cabecera?: string) {
    const token = tokenBearer(cabecera);
    if (token) await this.cerrar.ejecutar(token);
  }

  @Post('contrasena/olvido')
  @HttpCode(204)
  async olvido(@Body() datos: unknown) {
    await this.solicitarRestablecer.ejecutar(datos);
  }

  @Post('contrasena/restablecer')
  @HttpCode(204)
  async nuevaContrasena(@Body() datos: unknown) {
    await this.restablecer.ejecutar(datos).catch(aHttp);
  }

  @Post('google/inicio')
  @HttpCode(200)
  google(@Body() datos: unknown) {
    try {
      return { url: this.iniciarGoogle.ejecutar(datos) };
    } catch (e) {
      aHttp(e);
    }
  }

  @Post('google/fin')
  @HttpCode(200)
  async volverDeGoogle(@Body() datos: unknown) {
    return { token: await this.terminarGoogle.ejecutar(datos).catch(aHttp) };
  }
}

@Controller('clientes/yo')
@UseGuards(ClienteGuard)
export class CuentaController {
  constructor(
    private readonly obtener: ObtenerCuenta,
    private readonly actualizar: ActualizarPerfil,
    private readonly eliminar: EliminarCuenta,
    private readonly cambiarContrasena: CambiarContrasena,
    private readonly reenviar: ReenviarVerificacion,
    private readonly verificar: VerificarEmail,
    private readonly pedidosDe: PedidosDeCliente,
    private readonly listarDirecciones: ListarDirecciones,
    private readonly agregarDireccion: AgregarDireccion,
    private readonly borrarDireccion: BorrarDireccion,
  ) {}

  @Get()
  cuenta(@ClienteActual() c: ClienteEnSesion) {
    return this.obtener.ejecutar(c.id).catch(aHttp);
  }

  @Patch()
  perfil(@ClienteActual() c: ClienteEnSesion, @Body() datos: unknown) {
    return this.actualizar.ejecutar(c.id, datos).catch(aHttp);
  }

  @Delete()
  @HttpCode(204)
  async borrarCuenta(@ClienteActual() c: ClienteEnSesion, @Body() datos: unknown) {
    await this.eliminar.ejecutar(c.id, datos).catch(aHttp);
  }

  @Post('contrasena')
  @HttpCode(204)
  async contrasena(@ClienteActual() c: ClienteEnSesion, @Body() datos: unknown) {
    await this.cambiarContrasena.ejecutar(c.id, c.token, datos).catch(aHttp);
  }

  @Post('verificacion')
  @HttpCode(204)
  async reenviarVerificacion(@ClienteActual() c: ClienteEnSesion) {
    await this.reenviar.ejecutar(c.id).catch(aHttp);
  }

  // Con sesión: el enlace solo confirma el correo de la cuenta que lo abre (ver VerificarEmail).
  @Post('email/verificar')
  @HttpCode(204)
  async confirmarEmail(@ClienteActual() c: ClienteEnSesion, @Body() datos: unknown) {
    await this.verificar.ejecutar(c.id, datos).catch(aHttp);
  }

  @Get('pedidos')
  pedidos(@ClienteActual() c: ClienteEnSesion) {
    return this.pedidosDe.ejecutar(c.id).catch(aHttp);
  }

  @Get('direcciones')
  direcciones(@ClienteActual() c: ClienteEnSesion) {
    return this.listarDirecciones.ejecutar(c.id);
  }

  @Post('direcciones')
  @HttpCode(201)
  nuevaDireccion(@ClienteActual() c: ClienteEnSesion, @Body() datos: unknown) {
    return this.agregarDireccion.ejecutar(c.id, datos).catch(aHttp);
  }

  @Delete('direcciones/:id')
  @HttpCode(204)
  async quitarDireccion(@ClienteActual() c: ClienteEnSesion, @Param('id', ParseIntPipe) id: number) {
    if (!(await this.borrarDireccion.ejecutar(c.id, id))) throw new NotFoundException();
  }
}
