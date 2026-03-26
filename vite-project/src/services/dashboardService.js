const API_URL = "http://localhost:3008/api";

async function fetchJson(path) {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (isJson && payload && (payload.message || payload.error)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return payload;
}

function money(value) {
  return `L. ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export async function getLowStockProducts() {
  const payload = await fetchJson("/inventory/products/alertas/bajo-stock?umbral=50");
  const list = Array.isArray(payload?.data) ? payload.data : [];

  return list.map((item) => ({
    name: item.nombre,
    stock: Number(item.stock_total || 0),
    min: Number(item.umbral || 50),
  }));
}

export async function getLowStockDetail() {
  return getLowStockProducts();
}

export async function getExpiringDetail(days = 30) {
  const payload = await fetchJson(`/inventory/products/alertas/por-vencer?dias=${Number(days) || 30}`);
  const list = Array.isArray(payload?.data) ? payload.data : [];

  return list.map((item) => ({
    name: item.nombre,
    quantity: Number(item.cantidad || 0),
    expiryDate: item.fecha_vencimiento,
    daysLeft: Number(item.dias_para_vencer || 0),
  }));
}

export async function getWeeklySales() {
  const payload = await fetchJson("/semanal");
  const list = Array.isArray(payload) ? payload : [];
  return list.map((item) => ({
    name: item.dia,
    ventas: Number(item.total || 0),
  }));
}

export async function getMonthlyRevenue() {
  const payload = await fetchJson("/mensual");
  const list = Array.isArray(payload) ? payload : [];
  return list.map((item) => ({
    name: item.mes,
    ingresos: Number(item.total || 0),
  }));
}

export async function getDailyAnalysis() {
  const hoy = await fetchJson("/hoy");

  const total = Number(hoy?.total || 0);
  const sales = Number(hoy?.cantidad_ventas || 0);
  const ticketPromedio = sales > 0 ? total / sales : 0;

  return {
    fecha: new Date().toLocaleDateString("es-HN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    total: money(total),
    sales,
    ticketPromedio: money(ticketPromedio),
  };
}

export async function getDashboardStats() {
  const [hoy, lowStock, expiring, stockSummary] = await Promise.all([
    fetchJson("/hoy"),
    getLowStockProducts(),
    getExpiringDetail(30),
    fetchJson("/inventory/products/reporte/stock-total"),
  ]);

  const totalProductos = Array.isArray(stockSummary?.data) ? stockSummary.data.length : 0;

  return [
    {
      id: "ventas_dia",
      title: "Ventas del Día",
      value: money(hoy?.total || 0),
      trend: `${Number(hoy?.cantidad_ventas || 0)} venta(s)`,
      color: "green",
    },
    {
      id: "bajo_stock",
      title: "Productos Bajo Stock",
      value: String(lowStock.length),
      trend: "Umbral 50",
      color: "orange",
    },
    {
      id: "proximos_vencer",
      title: "Próximos a Vencer",
      value: String(expiring.length),
      trend: "30 días",
      color: "red",
    },
    {
      id: "total_inventario",
      title: "Total Inventario",
      value: String(totalProductos),
      trend: "Productos",
      color: "blue",
    },
  ];
}

export async function getNotifications() {
  const [lowStock, expiring, hoy] = await Promise.all([
    getLowStockProducts(),
    getExpiringDetail(30),
    fetchJson("/hoy"),
  ]);

  return [
    {
      id: 1,
      type: "warning",
      title: "Stock Bajo",
      message: `${lowStock.length} productos por debajo del mínimo`,
      time: "Actualizado hoy",
      detailType: "low_stock",
    },
    {
      id: 2,
      type: "danger",
      title: "Próximos a Vencer",
      message: `${expiring.length} productos vencen en menos de 30 días`,
      time: "Actualizado hoy",
      detailType: "expiring",
    },
    {
      id: 3,
      type: "success",
      title: "Ventas del Día",
      message: `${Number(hoy?.cantidad_ventas || 0)} venta(s) por ${money(hoy?.total || 0)}`,
      time: "Corte del día",
      detailType: null,
    },
  ];
}