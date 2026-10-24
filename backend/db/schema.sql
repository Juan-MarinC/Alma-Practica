-- Esquema inicial de la tienda (PostgreSQL 16)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE categorias (
  id        SERIAL PRIMARY KEY,
  slug      TEXT UNIQUE NOT NULL,
  nombre    TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  padre_id  INT REFERENCES categorias(id)
);

CREATE TABLE productos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  nombre       TEXT NOT NULL,
  descripcion  TEXT NOT NULL DEFAULT '',
  categoria_id INT NOT NULL REFERENCES categorias(id),
  precio_base  INT NOT NULL CHECK (precio_base > 0),          -- pesos colombianos, sin decimales
  precio_antes INT CHECK (precio_antes IS NULL OR precio_antes > precio_base),
  nuevo        BOOLEAN NOT NULL DEFAULT false,
  activo       BOOLEAN NOT NULL DEFAULT true,
  atributos    JSONB NOT NULL DEFAULT '{}',                    -- material, cuidados, ingredientes...
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX productos_categoria_idx ON productos (categoria_id) WHERE activo;

CREATE TABLE variantes (
  id          SERIAL PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  sku         TEXT UNIQUE NOT NULL,
  opciones    JSONB NOT NULL DEFAULT '{}',                     -- {"Talla":"M","Color":"Negro"}
  precio      INT CHECK (precio IS NULL OR precio > 0),        -- NULL = usa el precio del producto
  stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0)        -- nunca negativo
);
CREATE INDEX variantes_producto_idx ON variantes (producto_id);

CREATE TABLE imagenes (
  id          SERIAL PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  variante_id INT REFERENCES variantes(id) ON DELETE SET NULL,
  url         TEXT NOT NULL,
  orden       INT NOT NULL DEFAULT 0
);

CREATE TABLE clientes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  telefono        TEXT,
  contrasena_hash TEXT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE direcciones (
  id           SERIAL PRIMARY KEY,
  cliente_id   UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  departamento TEXT NOT NULL,
  ciudad       TEXT NOT NULL,
  direccion    TEXT NOT NULL,
  indicaciones TEXT
);

CREATE TYPE estado_pedido AS ENUM ('pendiente_pago', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado');

CREATE TABLE pedidos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero      SERIAL UNIQUE,
  cliente_id  UUID REFERENCES clientes(id),
  contacto    JSONB NOT NULL,          -- nombre, email, teléfono (sirve para compras como invitada)
  envio       JSONB NOT NULL,          -- departamento, ciudad, dirección
  estado      estado_pedido NOT NULL DEFAULT 'pendiente_pago',
  subtotal    INT NOT NULL,
  costo_envio INT NOT NULL DEFAULT 0,
  total       INT NOT NULL,
  guia_envio  TEXT,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pedido_items (
  pedido_id       UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  variante_id     INT NOT NULL REFERENCES variantes(id),
  cantidad        INT NOT NULL CHECK (cantidad > 0),
  precio_unitario INT NOT NULL,
  PRIMARY KEY (pedido_id, variante_id)
);

CREATE TABLE pagos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id   UUID NOT NULL REFERENCES pedidos(id),
  referencia  TEXT UNIQUE NOT NULL,    -- referencia enviada a Wompi
  metodo      TEXT,                    -- PSE, NEQUI, CARD, BANCOLOMBIA_TRANSFER
  estado      TEXT NOT NULL DEFAULT 'PENDING',
  respuesta   JSONB,                   -- evento completo recibido de Wompi
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
