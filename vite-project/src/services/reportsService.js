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

export async function getExpiringReport(days = 30) {
  const payload = await fetchJson(`/inventory/products/alertas/por-vencer?dias=${Number(days) || 30}`);
  const list = Array.isArray(payload?.data) ? payload.data : [];

  return list.map((item) => ({
    id: item.id_lote,
    code: item.codigo,
    name: item.nombre,
    quantity: Number(item.cantidad || 0),
    expiryDate: item.fecha_vencimiento,
    daysLeft: Number(item.dias_para_vencer || 0),
    expired: Boolean(item.vencido),
    price: Number(item.precio_venta || 0),
  }));
}

export async function getLowStockReport(threshold = 10) {
  const payload = await fetchJson(`/inventory/products/alertas/bajo-stock?umbral=${Number(threshold) || 10}`);
  const list = Array.isArray(payload?.data) ? payload.data : [];

  return list.map((item, idx) => ({
    id: `${item.codigo}-${idx}`,
    code: item.codigo,
    name: item.nombre,
    stock: Number(item.stock_total || 0),
    threshold: Number(item.umbral || threshold || 10),
  }));
}

export async function getStockSummaryReport() {
  const payload = await fetchJson("/inventory/products/reporte/stock-total");
  const list = Array.isArray(payload?.data) ? payload.data : [];

  const totals = list.reduce(
    (acc, item) => {
      const stock = Number(item.stock_total || 0);
      const price = Number(item.precio_venta_actual || 0);
      acc.totalProducts += 1;
      acc.totalStock += stock;
      acc.totalValue += stock * price;
      if (item.activo) acc.activeProducts += 1;
      else acc.inactiveProducts += 1;
      return acc;
    },
    {
      totalProducts: 0,
      activeProducts: 0,
      inactiveProducts: 0,
      totalStock: 0,
      totalValue: 0,
    },
  );

  return {
    summary: totals,
    products: list.map((item) => ({
      code: item.codigo,
      name: item.nombre,
      active: Boolean(item.activo),
      stock: Number(item.stock_total || 0),
      price: Number(item.precio_venta_actual || 0),
      activeLots: Number(item.lotes_activos || 0),
      totalLots: Number(item.lotes_totales || 0),
    })),
  };
}

export async function getSalesReport(fecha) {
  const dateText = String(fecha || new Date().toISOString().slice(0, 10));
  const payload = await fetchJson(`/ventas?fecha=${encodeURIComponent(dateText)}`);
  const ventas = Array.isArray(payload?.data) ? payload.data : [];

  const summary = ventas.reduce(
    (acc, v) => {
      const total = Number(v.total || 0);
      const detalles = Array.isArray(v?.Factura?.DetalleFacturas)
        ? v.Factura.DetalleFacturas
        : [];
      const unidades = detalles.reduce((s, d) => s + Number(d.cantidad || 0), 0);
      const metodo = String(v.metodo_pago || "desconocido").toLowerCase();

      acc.totalVentas += 1;
      acc.totalMonto += total;
      acc.totalUnidades += unidades;
      acc.porMetodo[metodo] = (acc.porMetodo[metodo] || 0) + total;
      return acc;
    },
    {
      totalVentas: 0,
      totalMonto: 0,
      totalUnidades: 0,
      porMetodo: {},
    },
  );

  return {
    summary,
    ventas: ventas.map((v) => ({
      id: v.id,
      numeroFactura: v?.Factura?.num_factura || `V-${v.id}`,
      fecha: v.fecha,
      metodoPago: v.metodo_pago || "-",
      clienteId: v.id_cliente ?? "-",
      total: Number(v.total || 0),
      items: Array.isArray(v?.Factura?.DetalleFacturas)
        ? v.Factura.DetalleFacturas.reduce((s, d) => s + Number(d.cantidad || 0), 0)
        : 0,
    })),
  };
}

export async function downloadReportPDF(type, params = {}) {
  const reportType = String(type || "stock").trim().toLowerCase();
  let endpoint = `${API_URL}/inventory/export/pdf`;

  if (reportType === "expiring") {
    endpoint = `${API_URL}/inventory/export/pdf/expiring?dias=${Number(params.days) || 30}`;
  } else if (reportType === "low-stock") {
    endpoint = `${API_URL}/inventory/export/pdf/low-stock?umbral=${Number(params.threshold) || 10}`;
  } else if (reportType !== "stock") {
    throw new Error("La exportacion PDF no esta disponible para este reporte.");
  }

  const res = await fetch(endpoint, { method: "GET" });
  if (!res.ok) {
    throw new Error(`No se pudo descargar el PDF (status ${res.status})`);
  }

  const blob = await res.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;

  const disposition = res.headers.get("content-disposition") || "";
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
  link.download = filenameMatch?.[1] || "reporte-inventario.pdf";

  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);

  return { success: true };
}
