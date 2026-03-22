/**
 * dashboardService.js
 *
 * Todos los datos del Dashboard viven aquí.
 * Cuando el backend esté listo, cada función solo necesita
 * reemplazar el "return mockData" por un fetch al endpoint indicado.
 *
 * Patrón de reemplazo:
 *   ANTES:  return MOCK_STATS;
 *   DESPUÉS: const res = await fetch("/api/dashboard/stats");
 *            return res.json();
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const MOCK_STATS = [
  {
    id: "ventas_dia",
    title: "Ventas del Día",
    value: "L. 45,230.50",
    trend: "+12%",
    color: "green",
  },
  {
    id: "bajo_stock",
    title: "Productos Bajo Stock",
    value: "23",
    trend: "Crítico",
    color: "orange",
  },
  {
    id: "proximos_vencer",
    title: "Próximos a Vencer",
    value: "8",
    trend: "15 días",
    color: "red",
  },
  {
    id: "total_inventario",
    title: "Total Inventario",
    value: "1,234",
    trend: "Productos",
    color: "blue",
  },
];

const MOCK_WEEKLY_SALES = [
  { name: "Lun", ventas: 4200 },
  { name: "Mar", ventas: 3800 },
  { name: "Mié", ventas: 5100 },
  { name: "Jue", ventas: 4600 },
  { name: "Vie", ventas: 6200 },
  { name: "Sáb", ventas: 5800 },
  { name: "Dom", ventas: 4900 },
];

const MOCK_MONTHLY_REVENUE = [
  { name: "Ene", ingresos: 45000 },
  { name: "Feb", ingresos: 52000 },
  { name: "Mar", ingresos: 48000 },
  { name: "Abr", ingresos: 61000 },
  { name: "May", ingresos: 55000 },
  { name: "Jun", ingresos: 67000 },
];

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "warning",
    title: "Stock Bajo",
    message: "Paracetamol 500mg tiene solo 15 unidades",
    time: "Hace 5 min",
  },
  {
    id: 2,
    type: "danger",
    title: "Próximo a Vencer",
    message: "Amoxicilina 500mg vence en 10 días",
    time: "Hace 1 hora",
  },
  {
    id: 3,
    type: "success",
    title: "Venta Completada",
    message: "Venta #1234 por L. 850.00",
    time: "Hace 2 horas",
  },
  {
    id: 4,
    type: "info",
    title: "Nuevo Cliente",
    message: "María González registrada en el sistema",
    time: "Hace 3 horas",
  },
];

const MOCK_LOW_STOCK = [
  { name: "Paracetamol 500mg", stock: 15, min: 50 },
  { name: "Ibuprofeno 400mg",  stock: 8,  min: 30 },
  { name: "Amoxicilina 500mg", stock: 12, min: 40 },
  { name: "Omeprazol 20mg",    stock: 5,  min: 25 },
  { name: "Losartán 50mg",     stock: 18, min: 35 },
];

// ─── Servicios ────────────────────────────────────────────────────────────────
// Simulamos delay de red para que los skeletons se vean en desarrollo.
// Cambiar a 0 si molesta, o eliminar el setTimeout al conectar el backend.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * KPIs principales del dashboard (4 tarjetas superiores).
 * TODO: reemplazar con → GET /api/dashboard/stats
 */
export async function getDashboardStats() {
  await delay(600);
  return MOCK_STATS;
}

/**
 * Ventas agrupadas por día de la semana actual.
 * TODO: reemplazar con → GET /api/dashboard/weekly-sales
 */
export async function getWeeklySales() {
  await delay(700);
  return MOCK_WEEKLY_SALES;
}

/**
 * Ingresos agrupados por mes (últimos 6 meses).
 * TODO: reemplazar con → GET /api/dashboard/monthly-revenue
 */
export async function getMonthlyRevenue() {
  await delay(700);
  return MOCK_MONTHLY_REVENUE;
}

/**
 * Notificaciones recientes del sistema.
 * TODO: reemplazar con → GET /api/notifications?limit=10
 */
export async function getNotifications() {
  await delay(500);
  return MOCK_NOTIFICATIONS;
}

/**
 * Productos con stock por debajo del mínimo.
 * TODO: reemplazar con → GET /api/inventory/low-stock
 */
export async function getLowStockProducts() {
  await delay(600);
  return MOCK_LOW_STOCK;
}