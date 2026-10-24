// Datos de la marca. Cambia aquí el nombre y los textos principales.
export const tienda = {
  nombre: "Alma",
  eslogan: "Boutique",
  descripcion: "Ropa, maquillaje y accesorios para sentirte tú, todos los días.",
  // El cobro real lo calcula el backend (TARIFAS_ENVIO en backend/src/pedidos/domain/pedido.ts): mantener iguales.
  envioFijo: 12000,
  envioGratisDesde: 250000,
  // Número con indicativo, ej. "573001234567". Vacío = no se muestra el enlace de WhatsApp.
  whatsapp: "",
};
