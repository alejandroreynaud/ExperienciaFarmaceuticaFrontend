/**
 * purchasesService.js
 *
 * Módulo de Compras — registro de facturas completas.
 * Cada factura puede incluir múltiples productos.
 * TODO: conectar con backend según endpoints indicados.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const MOCK_SUPPLIERS = [
  "Distribuidora Médica SA",
  "Farmacéutica Nacional",
  "Proveedora Salud",
  "Laboratorios Unidos",
];

const MOCK_INVOICES = [
  {
    id: 1,
    invoiceNumber: "FAC-2024-001",
    supplier: "Distribuidora Médica SA",
    rtn: "08019990123456",
    invoiceDate: "2024-03-10",
    products: [
      { productId: "MED-001", productName: "Paracetamol 500mg", quantity: 500, expiryDate: "2025-12-31" },
    ],
    total: 1250,
    imageUrl: null,
  },
  {
    id: 2,
    invoiceNumber: "FAC-2024-002",
    supplier: "Farmacéutica Nacional",
    rtn: "08019990654321",
    invoiceDate: "2024-03-09",
    products: [
      { productId: "MED-002", productName: "Ibuprofeno 400mg", quantity: 300, expiryDate: "2025-11-30" },
    ],
    total: 900,
    imageUrl: null,
  },
];

// Productos disponibles para el selector dentro del formulario de factura.
// TODO: reemplazar con getProducts() de inventoryService cuando estén conectados.
const MOCK_AVAILABLE_PRODUCTS = [
  { id: "MED-001", name: "Paracetamol 500mg",  code: "MED-001", description: "Analgésico y antipirético", cost: 2.5 },
  { id: "MED-002", name: "Ibuprofeno 400mg",   code: "MED-002", description: "Antiinflamatorio",          cost: 3.0 },
  { id: "MED-003", name: "Amoxicilina 500mg",  code: "MED-003", description: "Antibiótico",               cost: 8.0 },
  { id: "MED-004", name: "Omeprazol 20mg",     code: "MED-004", description: "Inhibidor de bomba",        cost: 4.5 },
  { id: "MED-005", name: "Losartán 50mg",      code: "MED-005", description: "Antihipertensivo",          cost: 5.0 },
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Servicios ────────────────────────────────────────────────────────────────

/**
 * Obtiene el historial de facturas de compra.
 * TODO: reemplazar con → GET /api/purchases/invoices
 */
export async function getInvoices() {
  await delay(600);
  return MOCK_INVOICES;
}

/**
 * Obtiene los proveedores disponibles.
 * TODO: reemplazar con → GET /api/purchases/suppliers
 */
export async function getSuppliers() {
  await delay(300);
  return MOCK_SUPPLIERS;
}

/**
 * Obtiene los productos disponibles para agregar a una factura.
 * TODO: reemplazar con → GET /api/inventory/products (solo catálogo)
 */
export async function getAvailableProducts() {
  await delay(300);
  return MOCK_AVAILABLE_PRODUCTS;
}

/**
 * Registra una nueva factura de compra.
 * @param {object} invoiceData - { invoiceNumber, supplier, rtn, invoiceDate, products, total, imageFile }
 * TODO: reemplazar con → POST /api/purchases/invoices
 *       Enviar como multipart/form-data si incluye imagen
 */
export async function createInvoice(invoiceData) {
  await delay(700);
  return {
    id: Date.now(),
    imageUrl: null,
    ...invoiceData,
  };
}

/**
 * Elimina una factura de compra.
 * @param {number} id - ID de la factura
 * TODO: reemplazar con → DELETE /api/purchases/invoices/:id
 */
export async function deleteInvoice(id) {
  await delay(400);
  return { success: true, id };
}

/**
 * Resumen del mes: total facturado, cantidad de facturas, unidades adquiridas.
 * TODO: reemplazar con → GET /api/purchases/summary?month=YYYY-MM
 */
export async function getPurchasesSummary() {
  await delay(400);
  return {
    totalMonth:   5550.00,
    totalMonthPct: "+8.5%",
    invoiceCount: MOCK_INVOICES.length,
    unitsBought:  1400,
  };
}