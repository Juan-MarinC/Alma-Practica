-- Cuentas de clientas: correo verificado, inicio con Google, sesiones y enlaces de un solo uso.
-- Para bases creadas antes de este cambio (schema.sql ya lo incluye para bases nuevas):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db/migraciones/001-cuentas.sql
BEGIN;

ALTER TABLE clientes
  ADD COLUMN email_verificado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN google_sub       TEXT UNIQUE,
  ADD COLUMN acepta_datos_en  TIMESTAMPTZ;

ALTER TABLE direcciones ADD COLUMN creada_en TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE INDEX direcciones_cliente_idx ON direcciones (cliente_id);

CREATE TABLE sesiones_cliente (
  token_hash TEXT PRIMARY KEY,           -- SHA-256 del token: la cookie no sirve si se filtra la base
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  expira     TIMESTAMPTZ NOT NULL,
  creada_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sesiones_cliente_idx ON sesiones_cliente (cliente_id);

CREATE TABLE enlaces_cliente (
  token_hash TEXT PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL CHECK (tipo IN ('verificar_email', 'restablecer_contrasena')),
  expira     TIMESTAMPTZ NOT NULL,
  usado_en   TIMESTAMPTZ
);

-- Al borrar una cuenta los pedidos se conservan (obligaciones contables), solo pierden el vínculo.
ALTER TABLE pedidos
  DROP CONSTRAINT pedidos_cliente_id_fkey,
  ADD CONSTRAINT pedidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL;
CREATE INDEX pedidos_cliente_idx ON pedidos (cliente_id);
CREATE INDEX pedidos_email_idx ON pedidos (lower(contacto->>'email'));

COMMIT;
