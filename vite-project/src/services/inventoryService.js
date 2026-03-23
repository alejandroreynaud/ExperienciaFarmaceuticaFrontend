/**
 * inventoryService.js
 *
 * Separamos catálogo de productos y lotes.
 * - Catálogo: nombre, código, descripción (sin costo ni precio)
 * - Lote: producto, cantidad, costo, precio, fecha vencimiento
 *
 * Hola, para este de aqui solo tienes que reemplazar el comentario TODO con el endpoint
 * que espero que tengamos en el back
 * TODO: conectar con backend según endpoints indicados.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const MOCK_PRODUCTS = [
  { id: 1, image: "💊", name: "Paracetamol 500mg",  code: "MED-001", description: "Analgésico y antipirético",       quantity: 150, cost: 2.5,  price: 5.0,  expiryDate: "2025-12-31" },
  { id: 2, image: "💊", name: "Ibuprofeno 400mg",   code: "MED-002", description: "Antiinflamatorio",                quantity: 80,  cost: 3.0,  price: 6.5,  expiryDate: "2025-11-30" },
  { id: 3, image: "💊", name: "Amoxicilina 500mg",  code: "MED-003", description: "Antibiótico",                     quantity: 45,  cost: 8.0,  price: 15.0, expiryDate: "2024-09-15" },
  { id: 4, image: "💊", name: "Omeprazol 20mg",     code: "MED-004", description: "Inhibidor de bomba de protones",  quantity: 120, cost: 4.5,  price: 9.0,  expiryDate: "2025-08-20" },
  { id: 5, image: "💊", name: "Losartán 50mg",      code: "MED-005", description: "Antihipertensivo",                quantity: 95,  cost: 5.0,  price: 10.5, expiryDate: "2026-01-10" },
];

const MOCK_SUPPLIERS = [
  { id: 1, name: "Distribuidora Médica SA",  phone: "2221-0001" },
  { id: 2, name: "Farmacéutica Nacional",    phone: "2221-0002" },
  { id: 3, name: "Proveedora Salud",         phone: "9988-7766" },
  { id: 4, name: "Laboratorios Unidos",      phone: "3344-5566" },
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Productos ────────────────────────────────────────────────────────────────

/**
 * Lista completa del inventario.
 * TODO: reemplazar con → GET /api/inventory/products
 */
export async function getProducts() {
  await delay(600);
  return MOCK_PRODUCTS;
}

/**
 * Registra un nuevo producto en el catálogo (nombre, código, descripción).
 * TODO: reemplazar con → POST /api/inventory/products
 */
export async function createProduct(data) {
  await delay(500);
  return { id: Date.now(), image: "💊", quantity: 0, cost: 0, price: 0, expiryDate: "", ...data };
}

/**
 * Edita datos de catálogo de un producto.
 * TODO: reemplazar con → PUT /api/inventory/products/:id
 */
export async function updateProduct(id, data) {
  await delay(500);
  return { id, ...data };
}

/**
 * Elimina un producto del catálogo.
 * TODO: reemplazar con → DELETE /api/inventory/products/:id
 */
export async function deleteProduct(id) {
  await delay(400);
  return { success: true, id };
}

// ─── Lotes ────────────────────────────────────────────────────────────────────

/**
 * Registra un ingreso manual de lote.
 * Campos: productId, quantity, cost, price, expiryDate.
 * TODO: reemplazar con → POST /api/inventory/lots
 */
export async function registerLot(data) {
  await delay(500);
  return { success: true, ...data };
}

// ─── Proveedores ──────────────────────────────────────────────────────────────

/**
 * Lista de proveedores registrados.
 * TODO: reemplazar con → GET /api/suppliers
 */
export async function getSuppliers() {
  await delay(400);
  return MOCK_SUPPLIERS;
}

/**
 * Crea un nuevo proveedor.
 * Campos: name, phone.
 * TODO: reemplazar con → POST /api/suppliers
 */
export async function createSupplier(data) {
  await delay(400);
  return { id: Date.now(), ...data };
}

/**
 * Elimina un proveedor.
 * TODO: reemplazar con → DELETE /api/suppliers/:id
 */
export async function deleteSupplier(id) {
  await delay(400);
  return { success: true, id };
}

// ─── Exportar ─────────────────────────────────────────────────────────────────

/**
 * Exporta el inventario a PDF.
 * TODO: reemplazar con → GET /api/inventory/export/pdf
 */
export async function exportInventoryPDF() {
  await delay(800);
  return { success: true };
}