const API_URL = "http://localhost:3008/api";

/**
 * Productos disponibles para venta con stock y precio real
 * GET /ventas/productos
 */
export async function getSaleProducts() {
  const res = await fetch(`${API_URL}/ventas/productos`);
  if (!res.ok) throw new Error("Error obteniendo productos");
  const json = await res.json();

  return json.data.map((p) => ({
    id:    p.id,
    name:  p.nombre,
    code:  p.codigo,
    price: p.precio_venta,
    stock: p.stock,
  }));
}

/**
 * Métodos de pago — enum del backend
 */
export async function getPaymentMethods() {
  return ["efectivo", "credito", "tarjeta", "transferencia"];
}

/**
 * Registra una venta completa
 * POST /ventas
 */
export async function createSale({ client, paymentMethod, items }) {
  const body = {
    id_vendedor: 1, // TODO: reemplazar con usuario autenticado
    id_cliente:  client ? Number(client) : null,
    metodo_pago: paymentMethod.toLowerCase(),
    productos:   items.map((i) => ({
      codigo:   i.code,
      cantidad: i.quantity,
    })),
  };

  const res = await fetch(`${API_URL}/ventas`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || "Error creando la venta");
  }

  return {
    id:         json.data.venta.id,
    saleNumber: json.data.factura.num_factura,
    date:       json.data.venta.fecha,
    total:      json.data.venta.total,
  };
}

/**
 * Calcula totales — sin ISV
 */
export function calculateTotals(items) {
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { subtotal: total, tax: 0, total };
}