const BASE_URL = "http://localhost:3008/api";

async function api(path, options = {}) {
    const res  = await fetch(`${BASE_URL}${path}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? "Error en la petición");
    return data;
}

// POST /api/proveedores
export async function createSupplier(nombre, telefono = "") {
    const { data } = await api("/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, telefono }),
    });
    return { id: data.id, name: data.nombre };
}

// GET /api/proveedores
export async function getSuppliers() {
    try {
        const { data } = await api("/proveedores");
        return data.map((p) => ({ id: p.id, name: p.nombre }));
    } catch {
        return [];
    }
}

// GET /api/compras
export async function getInvoices() {
    try {
        const { data } = await api("/compras");
        return data.map((c) => ({
            id:            c.id,
            invoiceNumber: `FAC-${String(c.id).padStart(4, "0")}`,
            supplier:      c.Proveedor?.nombre   ?? `Proveedor ${c.proveedor_id}`,
            rtn:           c.Proveedor?.telefono  ?? "",
            invoiceDate:   c.fecha,
            total:         c.total,
            imageUrl:      null,
            products: (c.DetalleCompras ?? []).map((d) => ({
                productId:   d.Inventario?.Producto?.codigo  ?? d.id_lote,
                productName: d.Inventario?.Producto?.nombre  ?? "Producto",
                quantity:    d.cantidad,
                expiryDate:  d.Inventario?.fecha_vencimiento ?? "",
            })),
        }));
    } catch {
        return [];
    }
}

// GET /api/compras/resumen
export async function getPurchasesSummary() {
    try {
        const { data } = await api("/compras/resumen");
        return {
            totalMonth:    data.suma_total    ?? 0,
            totalMonthPct: "+0.0%",
            invoiceCount:  data.total_compras ?? 0,
            unitsBought:   0,
        };
    } catch {
        return { totalMonth: 0, totalMonthPct: "+0.0%", invoiceCount: 0, unitsBought: 0 };
    }
}

// GET /api/productos
export async function getAvailableProducts() {
    try {
        const { data } = await api("/productos");
        return data.map((p) => ({
            id:   p.id,
            name: p.nombre,
            code: p.codigo,
        }));
    } catch {
        return [];
    }
}

// POST /api/compras
export async function createInvoice(invoiceData) {
    const { data } = await api("/compras", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            proveedor_id: invoiceData.supplier,
            fecha:        invoiceData.invoiceDate,
            total:        invoiceData.total,
            metodo_pago:  "efectivo",
            detalles: invoiceData.products.map((p) => ({
                id_lote:  p.productId,
                cantidad: p.quantity,
                subtotal: 0
            }))
        }),
    });
    return {
        id:            data.id,
        invoiceNumber: `FAC-${String(data.id).padStart(4, "0")}`,
        supplier:      invoiceData.supplier,
        rtn:           "",
        invoiceDate:   invoiceData.invoiceDate,
        total:         invoiceData.total,
        products:      invoiceData.products,
        imageUrl:      null,
    };
}