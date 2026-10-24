-- Datos de ejemplo
INSERT INTO categorias (slug, nombre, descripcion) VALUES
  ('ropa', 'Ropa', 'Blusas, vestidos y básicos'),
  ('maquillaje', 'Maquillaje', 'Labiales, bases y paletas'),
  ('accesorios', 'Accesorios', 'Bolsos, aretes y collares'),
  ('varios', 'Varios', 'Cuidado, hogar y detalles');

WITH p AS (
  INSERT INTO productos (slug, nombre, descripcion, categoria_id, precio_base, nuevo, atributos)
  VALUES ('blusa-seda', 'Blusa de seda', 'Blusa de seda satinada con caída suave y botones forrados.',
          (SELECT id FROM categorias WHERE slug = 'ropa'), 129900, true, '{"material":"Seda satinada","cuidado":"Lavar a mano"}')
  RETURNING id
)
INSERT INTO variantes (producto_id, sku, opciones, stock)
SELECT p.id, 'BLU-LUC-' || t || '-' || upper(left(c, 3)), jsonb_build_object('Talla', t, 'Color', c), 4
FROM p, unnest(ARRAY['S','M','L']) t, unnest(ARRAY['Nude','Negro']) c;

WITH p AS (
  INSERT INTO productos (slug, nombre, descripcion, categoria_id, precio_base, precio_antes, atributos)
  VALUES ('vestido-midi-lino', 'Vestido midi de lino', 'Vestido midi de lino con cintura ajustable y bolsillos laterales.',
          (SELECT id FROM categorias WHERE slug = 'ropa'), 189900, 229900, '{"material":"Lino"}')
  RETURNING id
)
INSERT INTO variantes (producto_id, sku, opciones, stock)
SELECT p.id, 'VES-VAL-' || t, jsonb_build_object('Talla', t), 3 FROM p, unnest(ARRAY['XS','S','M','L']) t;

WITH p AS (
  INSERT INTO productos (slug, nombre, descripcion, categoria_id, precio_base, nuevo, atributos)
  VALUES ('labial-mate-rosa', 'Labial mate Rosa Viejo', 'Labial de larga duración con acabado mate aterciopelado.',
          (SELECT id FROM categorias WHERE slug = 'maquillaje'), 39900, true, '{"contenido":"3.5 g","vegano":true}')
  RETURNING id
)
INSERT INTO variantes (producto_id, sku, opciones, stock)
SELECT p.id, 'LAB-MAT-' || upper(left(replace(t, ' ', ''), 4)), jsonb_build_object('Tono', t), 10
FROM p, unnest(ARRAY['Rosa viejo','Terracota','Rojo clásico']) t;

WITH p AS (
  INSERT INTO productos (slug, nombre, descripcion, categoria_id, precio_base)
  VALUES ('aretes-perla', 'Aretes de perla', 'Aretes con perla de agua dulce y baño en oro de 18k.',
          (SELECT id FROM categorias WHERE slug = 'accesorios'), 59900)
  RETURNING id
)
INSERT INTO variantes (producto_id, sku, stock) SELECT p.id, 'ARE-PER', 6 FROM p;

WITH p AS (
  INSERT INTO productos (slug, nombre, descripcion, categoria_id, precio_base, nuevo, atributos)
  VALUES ('jean-tiro-alto', 'Jean tiro alto', 'Jean colombiano de tiro alto con efecto levanta cola y tela que se adapta.',
          (SELECT id FROM categorias WHERE slug = 'ropa'), 149900, true, '{"material":"Denim con elastano"}')
  RETURNING id
)
INSERT INTO variantes (producto_id, sku, opciones, stock)
SELECT p.id, 'JEA-SOF-' || t, jsonb_build_object('Talla', t), 5 FROM p, unnest(ARRAY['6','8','10','12']) t;

WITH p AS (
  INSERT INTO productos (slug, nombre, descripcion, categoria_id, precio_base, atributos)
  VALUES ('base-luminosa', 'Base luminosa Glow', 'Base de cobertura media con acabado natural luminoso y protección solar.',
          (SELECT id FROM categorias WHERE slug = 'maquillaje'), 79900, '{"contenido":"30 ml","protección":"FPS 30"}')
  RETURNING id
)
INSERT INTO variantes (producto_id, sku, opciones, stock)
SELECT p.id, 'BAS-GLO-' || upper(left(t, 3)), jsonb_build_object('Tono', t), 8
FROM p, unnest(ARRAY['Claro','Medio','Canela','Profundo']) t;

WITH p AS (
  INSERT INTO productos (slug, nombre, descripcion, categoria_id, precio_base, precio_antes)
  VALUES ('paleta-nude', 'Paleta de sombras Nude', 'Doce tonos neutros, mates y satinados, para looks de día y de noche.',
          (SELECT id FROM categorias WHERE slug = 'maquillaje'), 99900, 119900)
  RETURNING id
)
INSERT INTO variantes (producto_id, sku, stock) SELECT p.id, 'PAL-NUD', 7 FROM p;

WITH p AS (
  INSERT INTO productos (slug, nombre, descripcion, categoria_id, precio_base, nuevo, atributos)
  VALUES ('bolso-tote', 'Bolso tote', 'Bolso amplio en cuero sintético con bolsillo interno para portátil.',
          (SELECT id FROM categorias WHERE slug = 'accesorios'), 169900, true, '{"material":"Cuero sintético"}')
  RETURNING id
)
INSERT INTO variantes (producto_id, sku, opciones, stock)
SELECT p.id, 'BOL-CAM-' || upper(left(replace(c, ' ', ''), 4)), jsonb_build_object('Color', c), 3
FROM p, unnest(ARRAY['Camel','Negro','Blanco hueso']) c;

WITH p AS (
  INSERT INTO productos (slug, nombre, descripcion, categoria_id, precio_base)
  VALUES ('collar-dije-luna', 'Collar con dije de luna', 'Cadena delicada con dije de luna, ajustable de 40 a 45 cm.',
          (SELECT id FROM categorias WHERE slug = 'accesorios'), 69900)
  RETURNING id
)
INSERT INTO variantes (producto_id, sku, stock) SELECT p.id, 'COL-LUN', 9 FROM p;

WITH p AS (
  INSERT INTO productos (slug, nombre, descripcion, categoria_id, precio_base, nuevo)
  VALUES ('set-skincare', 'Set de cuidado facial', 'Limpiador, sérum de vitamina C e hidratante en un set de regalo.',
          (SELECT id FROM categorias WHERE slug = 'varios'), 119900, true)
  RETURNING id
)
INSERT INTO variantes (producto_id, sku, stock) SELECT p.id, 'SET-SKI', 4 FROM p;

WITH p AS (
  INSERT INTO productos (slug, nombre, descripcion, categoria_id, precio_base, atributos)
  VALUES ('vela-aromatica', 'Vela aromática Vainilla', 'Vela de cera de soya con aroma a vainilla y flor de algodón.',
          (SELECT id FROM categorias WHERE slug = 'varios'), 45900, '{"duración":"40 horas"}')
  RETURNING id
)
INSERT INTO variantes (producto_id, sku, stock) SELECT p.id, 'VEL-VAI', 12 FROM p;

WITH p AS (
  INSERT INTO productos (slug, nombre, descripcion, categoria_id, precio_base, atributos)
  VALUES ('pijama-satin', 'Pijama de satín', 'Pijama de dos piezas en satín con ribete en contraste.',
          (SELECT id FROM categorias WHERE slug = 'ropa'), 119900, '{"material":"Satín"}')
  RETURNING id
)
INSERT INTO variantes (producto_id, sku, opciones, stock)
SELECT p.id, 'PIJ-MIA-' || t, jsonb_build_object('Talla', t), 2 FROM p, unnest(ARRAY['S','M','L']) t;

-- Fotos de ejemplo de Unsplash (licencia gratuita para uso comercial, sin marcas visibles), recortadas a 4:5.
-- Son provisionales: reemplazarlas desde el panel por fotos de los productos reales.
INSERT INTO imagenes (producto_id, url)
SELECT p.id, 'https://images.unsplash.com/photo-' || f.foto || '?w=1000&h=1250&fit=crop&crop=entropy&q=80&auto=format'
FROM productos p JOIN (VALUES
  ('blusa-seda', '1612889002991-fbfaf775d231'),
  ('vestido-midi-lino', '1747396206869-75ea57b325ce'),
  ('labial-mate-rosa', '1625093742435-6fa192b6fb10'),
  ('aretes-perla', '1682822749969-61a63203c501'),
  ('base-luminosa', '1608571423902-eed4a5ad8108'),
  ('paleta-nude', '1625094640367-05f84293fe42'),
  ('pijama-satin', '1770294758981-484ef12c1815'),
  ('jean-tiro-alto', '1598554747436-c9293d6a588f'),
  ('bolso-tote', '1624687943971-e86af76d57de'),
  ('collar-dije-luna', '1705326452390-3ecf6070595f'),
  ('vela-aromatica', '1612293905607-b003de9e54fb'),
  ('set-skincare', '1785581778868-79100f7fe56c')
) AS f(slug, foto) ON f.slug = p.slug;
