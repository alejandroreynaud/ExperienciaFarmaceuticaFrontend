/**
 * inventoryService.js
 *
 * Todos los datos del módulo de Inventario viven aquí.
 * Para conectar con el backend, reemplaza cada función
 * según el endpoint indicado en el comentario TODO.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const MOCK_PRODUCTS = [
  {
    id: 1,
    image: "💊",
    name: "Paracetamol 500mg",
    code: "MED-001",
    description: "Analgésico y antipirético",
    cost: 2.5,
    price: 5.0,
    quantity: 150,
    category: "Analgésicos",
    expiryDate: "2025-12-31",
  },
  {
    id: 2,
    image: "💊",
    name: "Ibuprofeno 400mg",
    code: "MED-002",
    description: "Antiinflamatorio",
    cost: 3.0,
    price: 6.5,
    quantity: 80,
    category: "Antiinflamatorios",
    expiryDate: "2025-11-30",
  },
  {
    id: 3,
    image: "💊",
    name: "Amoxicilina 500mg",
    code: "MED-003",
    description: "Antibiótico",
    cost: 8.0,
    price: 15.0,
    quantity: 45,
    category: "Antibióticos",
    expiryDate: "2024-09-15",
  },
  {
    id: 4,
    image: "💊",
    name: "Omeprazol 20mg",
    code: "MED-004",
    description: "Inhibidor de bomba de protones",
    cost: 4.5,
    price: 9.0,
    quantity: 120,
    category: "Gastroenterología",
    expiryDate: "2025-08-20",
  },
  {
    id: 5,
    image: "💊",
    name: "Losartán 50mg",
    code: "MED-005",
    description: "Antihipertensivo",
    cost: 5.0,
    price: 10.5,
    quantity: 95,
    category: "Cardiovascular",
    expiryDate: "2026-01-10",
  },
];

// no mames creo que nos falto esta parte de categorias... dejemoslo constante 💀
const MOCK_CATEGORIES = [
  "Analgésicos",
  "Antiinflamatorios",
  "Antibióticos",
  "Gastroenterología",
  "Cardiovascular",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Servicios ────────────────────────────────────────────────────────────────

/**
 * Obtiene la lista completa de productos del inventario.
 * TODO: reemplazar con → GET /api/inventory/products
 */
export async function getProducts() {
  await delay(600);
  return MOCK_PRODUCTS;
}

/**
 * Obtiene las categorías disponibles para el filtro.
 * TODO: reemplazar con → GET /api/inventory/categories
 * NO APLICA ESTE CREO (no tenemos categorias contempladas en la base)
 */
export async function getCategories() {
  await delay(300);
  return MOCK_CATEGORIES;
}

/**
 * Crea un nuevo producto en el inventario.
 * @param {object} productData - Datos del formulario
 * TODO: reemplazar con → POST /api/inventory/products
 */
export async function createProduct(productData) {
  await delay(500);
  // Mock: devuelve el producto con un id generado
  return { id: Date.now(), image: "💊", ...productData };
}

/**
 * Actualiza un producto existente.
 * @param {number} id - ID del producto
 * @param {object} productData - Datos actualizados
 * TODO: reemplazar con → PUT /api/inventory/products/:id
 */
export async function updateProduct(id, productData) {
  await delay(500);
  return { id, ...productData };
}

/**
 * Elimina un producto del inventario.
 * @param {number} id - ID del producto a eliminar
 * TODO: reemplazar con → DELETE /api/inventory/products/:id
 */
export async function deleteProduct(id) {
  await delay(400);
  return { success: true, id };
}

/**
 * Exporta el inventario a PDF.
 * TODO: reemplazar con → GET /api/inventory/export/pdf
 *       (el backend devuelve un blob, abrir con window.open o descargar)
 */
export async function exportInventoryPDF() {
  await delay(800);
  return { success: true, message: "PDF generado correctamente" };
}