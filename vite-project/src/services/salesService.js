/**
 * salesService.js
 *
 * Módulo de Ventas (POS).
 * TODO: conectar con backend según endpoints indicados.
 */

const MOCK_PRODUCTS = [
  { id: 1, name: "Paracetamol 500mg",   price: 5.0,  stock: 150 },
  { id: 2, name: "Ibuprofeno 400mg",    price: 6.5,  stock: 80  },
  { id: 3, name: "Amoxicilina 500mg",   price: 15.0, stock: 45  },
  { id: 4, name: "Omeprazol 20mg",      price: 9.0,  stock: 120 },
  { id: 5, name: "Losartán 50mg",       price: 10.5, stock: 95  },
  { id: 6, name: "Metformina 850mg",    price: 8.0,  stock: 110 },
  { id: 7, name: "Atorvastatina 20mg",  price: 12.5, stock: 65  },
];

const MOCK_PAYMENT_METHODS = ["Efectivo", "Tarjeta", "Transferencia"];

const TAX_RATE = 0.15; // ISV Honduras 15%

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Productos disponibles para la venta con precio y stock actual.
 * TODO: reemplazar con → GET /api/sales/products
 */
export async function getSaleProducts() {
  await delay(500);
  return MOCK_PRODUCTS;
}

/**
 * Métodos de pago disponibles.
 * TODO: reemplazar con → GET /api/sales/payment-methods
 */
export async function getPaymentMethods() {
  await delay(200);
  return MOCK_PAYMENT_METHODS;
}

/**
 * Registra una venta completa.
 * @param {object} saleData - { client, paymentMethod, items, subtotal, tax, total }
 * TODO: reemplazar con → POST /api/sales
 */
export async function createSale(saleData) {
  await delay(600);
  return {
    id:           Date.now(),
    saleNumber:   `VTA-${Date.now()}`,
    date:         new Date().toISOString(),
    ...saleData,
  };
}

/**
 * Calcula los totales de una venta.
 * Esta lógica puede quedar en el frontend o delegarse al backend.
 */
export function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax      = subtotal * TAX_RATE;
  const total    = subtotal + tax;
  return { subtotal, tax, total, taxRate: TAX_RATE };
}