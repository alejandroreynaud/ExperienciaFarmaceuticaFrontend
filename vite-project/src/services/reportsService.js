/**
 * reportsService.js
 *
 * Módulo de Reportes: financiero, inventario y medicamentos por vencer.
 * TODO: conectar con backend según endpoints indicados.
 */

const MOCK_FINANCIAL = [
  { month: "Enero",    ingresos: 45000, egresos: 28000 },
  { month: "Febrero",  ingresos: 52000, egresos: 30000 },
  { month: "Marzo",    ingresos: 48000, egresos: 29000 },
  { month: "Abril",    ingresos: 61000, egresos: 32000 },
  { month: "Mayo",     ingresos: 55000, egresos: 31000 },
  { month: "Junio",    ingresos: 67000, egresos: 35000 },
];

const MOCK_FINANCIAL_SUMMARY = {
  ingresos:  328000,
  egresos:   185000,
  utilidad:  143000,
  margen:    43.6,
  trend:     "+15.3%",
};

const MOCK_CATEGORY_DATA = [
  { name: "Analgésicos",       value: 450 },
  { name: "Antibióticos",      value: 320 },
  { name: "Cardiovascular",    value: 280 },
  { name: "Gastroenterología", value: 210 },
  { name: "Otros",             value: 140 },
];

const MOCK_INVENTORY_SUMMARY = {
  totalProducts:  1234,
  totalValue:     52400,
  lowStockCount:  23,
  categories: [
    { category: "Analgésicos",       products: 15, totalValue: 8500  },
    { category: "Antibióticos",      products: 12, totalValue: 12300 },
    { category: "Cardiovascular",    products: 10, totalValue: 15600 },
    { category: "Gastroenterología", products: 8,  totalValue: 6800  },
    { category: "Otros",             products: 20, totalValue: 9200  },
  ],
};

const MOCK_EXPIRING = [
  { name: "Amoxicilina 500mg",      quantity: 45, expiryDate: "2024-09-15", daysLeft: 15 },
  { name: "Diclofenac 75mg",        quantity: 30, expiryDate: "2024-09-20", daysLeft: 20 },
  { name: "Ciprofloxacino 500mg",   quantity: 25, expiryDate: "2024-09-25", daysLeft: 25 },
  { name: "Ranitidina 150mg",       quantity: 18, expiryDate: "2024-10-01", daysLeft: 31 },
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Datos mensuales de ingresos y egresos para gráficas.
 * @param {string} dateFrom - YYYY-MM-DD
 * @param {string} dateTo   - YYYY-MM-DD
 * TODO: reemplazar con → GET /api/reports/financial?from=&to=
 */
export async function getFinancialReport(dateFrom, dateTo) {
  await delay(600);
  return { chart: MOCK_FINANCIAL, summary: MOCK_FINANCIAL_SUMMARY };
}

/**
 * Datos de inventario: resumen general y distribución por categoría.
 * @param {string} dateFrom
 * @param {string} dateTo
 * TODO: reemplazar con → GET /api/reports/inventory?from=&to=
 */
export async function getInventoryReport(dateFrom, dateTo) {
  await delay(600);
  return { summary: MOCK_INVENTORY_SUMMARY, categories: MOCK_CATEGORY_DATA };
}

/**
 * Productos próximos a vencer en los próximos N días.
 * @param {string} dateFrom
 * @param {string} dateTo
 * TODO: reemplazar con → GET /api/reports/expiring?from=&to=
 */
export async function getExpiringReport(dateFrom, dateTo) {
  await delay(600);
  return MOCK_EXPIRING;
}

/**
 * Descarga un reporte en PDF.
 * @param {string} type - "financial" | "inventory" | "expiring"
 * @param {string} dateFrom
 * @param {string} dateTo
 * TODO: reemplazar con → GET /api/reports/export/pdf?type=&from=&to=
 *       El backend devuelve un blob → usar URL.createObjectURL(blob)
 */
export async function downloadReportPDF(type, dateFrom, dateTo) {
  await delay(800);
  return { success: true };
}