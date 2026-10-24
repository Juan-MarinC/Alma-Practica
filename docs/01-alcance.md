# Paso 1: Alcance y diseño

## Primera versión (MVP)

### Para las clientas
- **Inicio:** banner principal animado, categorías destacadas, novedades y más vendidos.
- **Catálogo:** listado por categoría (Ropa, Maquillaje, Accesorios, Varios), filtros por precio, talla, color y tono, orden por precio o novedad, buscador.
- **Detalle de producto:** galería de fotos, selector de variante (talla / color / tono), stock disponible, agregar al carrito.
- **Carrito:** panel lateral animado, editar cantidades, subtotal y costo de envío.
- **Checkout:** datos de envío (departamento, ciudad, dirección), pago con Wompi, compra como invitada o con cuenta.
- **Cuenta:** registro e inicio de sesión, historial de pedidos y direcciones guardadas.
- **Pedidos:** correo de confirmación y estado del pedido (pagado, preparando, enviado, entregado).

### Para ti (panel de administración)
- Crear y editar productos con variantes, fotos y precio.
- Inventario por variante (por ejemplo, Blusa X talla M color negro: 4 unidades).
- Ver pedidos, cambiar su estado y registrar el número de guía de envío.
- Tarifas de envío por ciudad o una tarifa fija.

### Para después (no entra en la primera versión)
- Cupones y descuentos.
- Lista de deseos y reseñas.
- Integración automática con transportadoras (Servientrega, Coordinadora, Interrapidísimo).
- Facturación electrónica DIAN automática (se revisa en el paso 4).
- Pago contra entrega.

## Modelo de datos inicial (PostgreSQL)
- `categorias` (id, nombre, slug, padre_id)
- `productos` (id, nombre, slug, descripción, categoría_id, precio_base, activo, **atributos JSONB**)
- `variantes` (id, producto_id, sku, opciones JSONB como `{"talla":"M","color":"Negro"}`, precio, stock)
- `imagenes` (id, producto_id, variante_id, url, orden)
- `clientes` (id, nombre, email, teléfono, contraseña_hash)
- `direcciones` (id, cliente_id, departamento, ciudad, dirección, indicaciones)
- `pedidos` (id, cliente_id o datos de invitada, estado, subtotal, envío, total, dirección)
- `pedido_items` (pedido_id, variante_id, cantidad, precio_unitario)
- `pagos` (id, pedido_id, referencia_wompi, método, estado, respuesta JSONB)

El stock se descuenta dentro de una transacción al confirmarse el pago, así nunca se vende dos veces la última unidad.

## Arquitectura hexagonal del backend
```
backend/src/
  catalogo/      domain/ (entidades, reglas)  application/ (casos de uso)  infrastructure/ (Postgres, HTTP)
  carrito/
  pedidos/
  pagos/         infrastructure/wompi/  (adaptador de la pasarela)
  clientes/
  shared/
```
El dominio no sabe nada de Postgres ni de Wompi; si mañana cambias de pasarela solo se reemplaza el adaptador.

## Moodboard de animaciones
Estilo general: femenino, limpio y elegante. Fondo claro con tonos nude / rosa palo, tipografía serif para títulos y sans para texto, mucho espacio en blanco.

| Sección | Efecto | Librería sugerida |
|---|---|---|
| Banner de inicio | Fondo suave animado (Aurora o Silk) + título que aparece letra por letra (Split Text / Blur Text) | React Bits |
| Categorías | Galería circular o tarjetas con inclinación al pasar el mouse (Circular Gallery / Tilted Card) | React Bits |
| Novedades | Carrusel infinito de productos (Infinite Slider) | Motion Primitives |
| Tarjeta de producto | Tilt + Spotlight al pasar el mouse, cambio a segunda foto | Motion Primitives |
| Detalle de producto | Morphing Dialog para ampliar fotos | Motion Primitives |
| Precios y contador del carrito | Animated Number | Motion Primitives |
| Botones principales | Efecto magnético y brillo (Magnetic / Text Shimmer) | Motion Primitives |
| Carrito | Panel lateral con transición suave | Motion |
| Formularios y checkout | Inputs y pasos con estilo de Watermelon UI | Watermelon UI |

Regla: las animaciones van en inicio y en interacciones; el checkout se mantiene sobrio y rápido para no distraer al pagar. Todo respeta `prefers-reduced-motion`.

## Pendientes por definir contigo
- Nombre de la tienda y logo (si ya los tienes).
- Paleta de colores definitiva.
- Cómo vas a enviar: tarifa fija nacional o por ciudad.
