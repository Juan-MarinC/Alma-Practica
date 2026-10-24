import {
  ConflictoProducto,
  DatosInvalidos,
  ProductoNoEncontrado,
  validarProducto,
  type Producto,
} from '../domain/producto.js';
import { RepositorioProductosMemoria } from '../infrastructure/memoria/repositorio-productos-memoria.js';
import { GuardarProducto } from './guardar-producto.js';
import { ListarProductos } from './listar-productos.js';
import { ListarProductosAdmin } from './listar-productos-admin.js';
import { ObtenerProducto } from './obtener-producto.js';

const base: Omit<Producto, 'id' | 'slug' | 'nombre' | 'categoria' | 'variantes'> = {
  descripcion: '',
  precio: 100000,
  precioAntes: null,
  nuevo: false,
  activo: true,
  atributos: {},
  imagenes: [],
};

const repo = new RepositorioProductosMemoria([
  { ...base, id: '1', slug: 'blusa', nombre: 'Blusa', categoria: 'ropa', variantes: [{ sku: 'b-s', opciones: { Talla: 'S' }, precio: 100000, stock: 2 }] },
  { ...base, id: '2', slug: 'labial', nombre: 'Labial', categoria: 'maquillaje', variantes: [{ sku: 'l-1', opciones: {}, precio: 30000, stock: 0 }] },
  { ...base, id: '3', slug: 'oculto', nombre: 'Oculto', categoria: 'ropa', activo: false, variantes: [] },
]);

describe('Catálogo', () => {
  it('lista solo productos activos y calcula disponibilidad', async () => {
    const r = await new ListarProductos(repo).ejecutar({});
    expect(r.map((p) => p.slug)).toEqual(['blusa', 'labial']);
    expect(r.find((p) => p.slug === 'labial')?.disponible).toBe(false);
  });

  it('filtra por categoría', async () => {
    const r = await new ListarProductos(repo).ejecutar({ categoria: 'ropa' });
    expect(r.map((p) => p.slug)).toEqual(['blusa']);
  });

  it('falla si el producto no existe o está inactivo', async () => {
    const caso = new ObtenerProducto(repo);
    await expect(caso.ejecutar('nada')).rejects.toBeInstanceOf(ProductoNoEncontrado);
    await expect(caso.ejecutar('oculto')).rejects.toBeInstanceOf(ProductoNoEncontrado);
    expect((await caso.ejecutar('blusa')).stockTotal).toBe(2);
  });
});

describe('Administración de productos', () => {
  const valido = {
    slug: 'falda-nueva',
    nombre: 'Falda nueva',
    categoria: 'ropa',
    precio: 90000,
    variantes: [{ sku: 'FAL-S', opciones: { Talla: 'S' }, stock: 3 }],
  };

  it('normaliza datos válidos', () => {
    const p = validarProducto({ ...valido, nombre: '  Falda nueva ', precioAntes: 120000 });
    expect(p).toMatchObject({ nombre: 'Falda nueva', activo: true, nuevo: false, imagenes: [], precioAntes: 120000 });
    expect(p.variantes[0].precio).toBeNull();
  });

  it('rechaza datos inválidos con todos los errores', () => {
    const intento = () =>
      validarProducto({
        slug: 'Con Espacios',
        precio: 10.5,
        precioAntes: 5,
        imagenes: ['http://inseguro.com/a.jpg'],
        variantes: [
          { sku: 'A', stock: -1 },
          { sku: 'A', stock: 1, opciones: { Talla: 3 } },
        ],
      });
    expect(intento).toThrow(DatosInvalidos);
    try {
      intento();
    } catch (e) {
      expect((e as DatosInvalidos).errores).toHaveLength(9);
    }
    expect(() => validarProducto(null)).toThrow(DatosInvalidos);
    expect(validarProducto({ ...valido, imagenes: ['/productos/falda.svg', 'https://cdn.ejemplo.co/a.jpg'] }).imagenes).toHaveLength(2);
    for (const mala of ['/../secreto.svg', '//otro.com/a.jpg', 'javascript:alert(1)', '/productos/a.html'])
      expect(() => validarProducto({ ...valido, imagenes: [mala] }), mala).toThrow(DatosInvalidos);
  });

  it('crea, edita y protege slugs únicos', async () => {
    const repo = new RepositorioProductosMemoria();
    const guardar = new GuardarProducto(repo);
    const creado = await guardar.ejecutar(valido);
    expect(creado.variantes[0].precio).toBe(90000); // sin precio propio usa el del producto

    await guardar.ejecutar({ ...valido, slug: 'falda-midi', activo: false }, 'falda-nueva');
    const admin = await new ListarProductosAdmin(repo).ejecutar();
    expect(admin.map((p) => [p.slug, p.activo, p.stockTotal])).toEqual([['falda-midi', false, 3]]);

    await guardar.ejecutar(valido);
    await expect(guardar.ejecutar(valido, 'falda-midi')).rejects.toBeInstanceOf(ConflictoProducto);
    await expect(guardar.ejecutar(valido, 'no-existe')).rejects.toBeInstanceOf(ProductoNoEncontrado);
    // Los datos inválidos también llegan como promesa rechazada (el controlador usa .catch).
    await expect(guardar.ejecutar({})).rejects.toBeInstanceOf(DatosInvalidos);
  });

  it('no pisa el stock si cambió mientras se editaba (venta en curso)', async () => {
    const repo = new RepositorioProductosMemoria();
    const guardar = new GuardarProducto(repo);
    await guardar.ejecutar(valido); // stock 3
    const variante = (stockAnterior: number) => [{ sku: 'FAL-S', opciones: { Talla: 'S' }, stock: 10, stockAnterior }];
    await expect(guardar.ejecutar({ ...valido, variantes: variante(2) }, 'falda-nueva')).rejects.toBeInstanceOf(ConflictoProducto);
    const ok = await guardar.ejecutar({ ...valido, variantes: variante(3) }, 'falda-nueva');
    expect(ok.variantes[0]).toEqual({ sku: 'FAL-S', opciones: { Talla: 'S' }, precio: 90000, stock: 10 });
  });
});
