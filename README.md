# Tienda online

Tienda propia de artículos para mujer (ropa, maquillaje y accesorios). Opera solo en Colombia, en pesos colombianos.

## Stack
- **frontend/**: Next.js 16 + React 19 + Tailwind CSS 4 + Motion (efectos inspirados en React Bits y Motion Primitives)
- **backend/**: NestJS 12 (TypeScript) con arquitectura hexagonal
- **Base de datos:** PostgreSQL 16 (JSONB para atributos variables)
- **Pagos:** Wompi (PSE, Nequi, tarjetas, Bancolombia), paso 3

## Cómo verla en tu computador

Necesitas [Node.js 22 o más](https://nodejs.org).

La tienda lee los productos del backend, así que se levantan las tres piezas en orden.

### 1. Base de datos
Con [Docker Desktop](https://www.docker.com/products/docker-desktop/):
```bash
docker compose up -d          # crea PostgreSQL con el esquema y los productos de ejemplo
```

Sin Docker (PostgreSQL 18 instalado en Windows), la base de desarrollo vive en `.pgdata/` y se arranca así:
```bash
"C:/Program Files/PostgreSQL/18/bin/pg_ctl" -D .pgdata -o "-p 5434" -l .pgdata/postgres.log start
```

### 2. Backend (http://localhost:4000/api/productos)
```bash
cd backend
copy .env.example .env        # en Windows (en Mac/Linux: cp); llena ADMIN_TOKEN
npm install
npm run start:dev
```

### 3. Tienda y panel (http://localhost:3000 y http://localhost:3000/admin)
```bash
cd frontend
copy .env.example .env.local  # mismo ADMIN_TOKEN que el backend y una ADMIN_CLAVE para entrar al panel
npm install
npm run dev
```
Para generar ADMIN_TOKEN: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

### 4. Pagos con Wompi
1. Crea tu cuenta en [Wompi](https://comercios.wompi.co) y copia las llaves **de pruebas** (Desarrolladores) en `backend/.env`: llave pública, llave privada, secreto de integridad y secreto de eventos. Nunca las pongas en el código ni en el frontend.
2. En Wompi, registra la URL de eventos: `https://TU-DOMINIO/api/pagos/wompi/eventos`. En tu computador Wompi no puede llegar a `localhost`, pero igual funciona: al volver del pago la tienda le pregunta a Wompi el resultado con la llave privada (sin ella, el pago solo se confirma por el evento).
3. Prueba una compra con los [datos de prueba de Wompi](https://docs.wompi.co/docs/colombia/datos-de-prueba-en-sandbox/). Para pasar a producción cambia a las llaves `prod` y `WOMPI_API_URL=https://production.wompi.co/v1`.
4. Correos de confirmación (opcional): crea una cuenta en [Resend](https://resend.com) y llena `RESEND_API_KEY`, `CORREO_REMITENTE` y `CORREO_TIENDA`.

### Datos personales
- Llaves y correos de la tienda viven solo en archivos `.env`, que Git ignora.
- Los datos de las clientas no viajan en URLs, no aparecen en los registros del servidor y la página pública del pedido no los muestra; solo el panel los ve.
- El checkout pide autorización de tratamiento de datos (Ley 1581 de 2012) y guarda la fecha. Completa los datos del responsable en `/privacidad` antes de lanzar.

## Dónde cambiar cosas
- Nombre, eslogan y costos de envío: `frontend/src/lib/config.ts`
- Colores y tipografías: `frontend/src/app/globals.css`
- Productos, precios, inventario y fotos: panel en http://localhost:3000/admin
- Productos de ejemplo iniciales: `backend/db/seed.sql`
- Tablas de la base de datos: `backend/db/schema.sql`
- Costo de envío: `TARIFAS_ENVIO` en `backend/src/pedidos/domain/pedido.ts` (y el mismo valor en `frontend/src/lib/config.ts`)
- Política de datos: `frontend/src/app/(tienda)/privacidad/page.tsx`

## Estructura del backend (hexagonal)
```
backend/src/catalogo/
  domain/          entidades y reglas (sin dependencias externas)
  application/     casos de uso: ListarProductos, ObtenerProducto, ListarProductosAdmin, GuardarProducto
  infrastructure/  adaptadores: http (controladores público y admin), postgres, memoria (pruebas)
```

## Plan
1. ✅ Alcance y diseño → [docs/01-alcance.md](docs/01-alcance.md)
2. ✅ Base técnica: tienda conectada al backend y panel de administración de productos
3. ✅ Pagos y pedidos: checkout como invitada, Wompi con webhooks firmados, stock descontado al aprobarse el pago, correos y pedidos en el panel
4. Lanzamiento (hosting, dominio, pruebas, facturación electrónica DIAN)
