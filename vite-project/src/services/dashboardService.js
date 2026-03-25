/**
 * dashboardService.js
 *
 * Todos los datos del Dashboard viven aquí.
 * Para conectar con el backend, reemplaza cada función
 * según el endpoint indicado en el comentario TODO.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const MOCK_STATS = [
  { id: "ventas_dia",       title: "Ventas del Día",          value: "L. 45,230.50", trend: "+12%",      color: "green"  },
  { id: "bajo_stock",       title: "Productos Bajo Stock",    value: "23",           trend: "Crítico",   color: "orange" },
  { id: "proximos_vencer",  title: "Próximos a Vencer",       value: "8",            trend: "15 días",   color: "red"    },
  { id: "total_inventario", title: "Total Inventario",        value: "1,234",        trend: "Productos", color: "blue"   },
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

// Notificaciones — cada una con su detalle según tipo
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "warning",
    title: "Stock Bajo",
    message: "5 productos por debajo del mínimo",
    time: "Hace 5 min",
    detailType: "low_stock",
  },
  {
    id: 2,
    type: "danger",
    title: "Próximos a Vencer",
    message: "4 productos vencen en menos de 30 días",
    time: "Hace 1 hora",
    detailType: "expiring",
  },
  /*
  {
    id: 3,
    type: "success",
    title: "Venta Completada",
    message: "Venta #1234 por L. 850.00",
    time: "Hace 2 horas",
    detailType: null,
  },
  
  {
    id: 4,
    type: "info",
    title: "Lote Registrado",
    message: "Se registró un nuevo lote de Paracetamol 500mg",
    time: "Hace 3 horas",
    detailType: null,
  },
  */
];

const MOCK_LOW_STOCK = [
  { name: "Paracetamol 500mg", stock: 15, min: 50 },
  { name: "Ibuprofeno 400mg",  stock: 8,  min: 30 },
  { name: "Amoxicilina 500mg", stock: 12, min: 40 },
  { name: "Omeprazol 20mg",    stock: 5,  min: 25 },
  { name: "Losartán 50mg",     stock: 18, min: 35 },
];

// Detalle de productos próximos a vencer
const MOCK_EXPIRING_DETAIL = [
  { name: "Amoxicilina 500mg",    quantity: 45, expiryDate: "2024-09-15", daysLeft: 10 },
  { name: "Diclofenac 75mg",      quantity: 30, expiryDate: "2024-09-20", daysLeft: 15 },
  { name: "Ciprofloxacino 500mg", quantity: 25, expiryDate: "2024-09-25", daysLeft: 20 },
  { name: "Ranitidina 150mg",     quantity: 18, expiryDate: "2024-10-01", daysLeft: 26 },
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Servicios ────────────────────────────────────────────────────────────────

/**
 * KPIs principales (4 tarjetas superiores).
 * TODO: reemplazar con → GET /api/dashboard/stats
 */
export async function getDashboardStats() {
  await delay(600);
  return MOCK_STATS;
}

/**
 * Ventas por día de la semana actual.
 * TODO: reemplazar con → GET /api/dashboard/weekly-sales
 */
export async function getWeeklySales() {
  await delay(700);
  return MOCK_WEEKLY_SALES;
}

/**
 * Ingresos mensuales (últimos 6 meses).
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

/**
 * Detalle de productos próximos a vencer.
 * TODO: reemplazar con → GET /api/inventory/expiring?days=30
 */
export async function getExpiringDetail() {
  await delay(400);
  return MOCK_EXPIRING_DETAIL;
}

/**
 * Detalle completo de stock bajo (igual que low-stock pero con más info).
 * TODO: reemplazar con → GET /api/inventory/low-stock?detail=true
 */
export async function getLowStockDetail() {
  await delay(400);
  return MOCK_LOW_STOCK;
}