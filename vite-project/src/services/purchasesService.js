const BASE_URL = import.meta.env.VITE_API_URL || "/api";

function withNoCacheParam(path) {
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}_t=${Date.now()}`;
}

async function api(path, options = {}) {
    const method = String(options.method || "GET").toUpperCase();
    const requestPath = method === "GET" ? withNoCacheParam(path) : path;
    const { headers: customHeaders = {}, ...restOptions } = options;

    const res = await fetch(`${BASE_URL}${requestPath}`, {
        ...(method === "GET" ? { cache: "no-store" } : {}),
        headers: {
            ...(method === "GET"
                ? {
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    Pragma: "no-cache",
                    Expires: "0",
                }
                : {}),
            ...customHeaders,
        },
        ...restOptions,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
        const message =
            (isJson && data && (data.message || data.error)) ||
            `Error en la petición (status ${res.status})`;
        throw new Error(message);
    }

    return data;
}

// POST /api/proveedores
export async function createSupplier(nombre, telefono = "") {
    // IMPORTANTE: Quitamos el try/catch de aquí para que el componente 
    // (Purchases.jsx) pueda capturar el error y mostrar la alerta.
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
            supplier:      c.DetalleCompras?.[0]?.Inventario?.LoteProveedors?.[0]?.Proveedor?.nombre
                ?? `Proveedor ${c.id_usuario ?? "N/A"}`,
            rtn:           c.rtn || "",
            invoiceDate:   c.fecha,
            total:         c.total,
            imageUrl:      null,
            products: (c.DetalleCompras ?? []).map((d) => ({
                productId:   d.Inventario?.Producto?.codigo  ?? d.id_lote,
                productName: d.Inventario?.Producto?.nombre  ?? "Producto",
                quantity:    d.cantidad,
                unitPrice:   Number(d.cantidad) > 0 ? Number(d.subtotal || 0) / Number(d.cantidad) : 0,
                subtotal:    Number(d.subtotal || 0),
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
            unitsBought:   data.total_unidades ?? 0,
        };
    } catch (error) {
        console.error("Error cargando resumen de compras:", error);
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

// POST /api/productos
export async function createProductFromPurchases(nombre, codigo, imagen = "") {
    const { data } = await api("/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, codigo, imagen }),
    });

    return {
        id: data.id,
        name: data.nombre,
        code: data.codigo,
    };
}

// POST /api/compras
export async function createInvoice(invoiceData) {
    const { data } = await api("/compras", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            proveedor_id: invoiceData.supplier,
            fecha:        invoiceData.invoiceDate,
            rtn:          invoiceData.rtn,
            total:        invoiceData.total,
            metodo_pago:  invoiceData.paymentMethod || "efectivo",
            detalles: invoiceData.products.map((p) => ({
                id_prod:  p.productId,
                cantidad: p.quantity,
                precio_costo: Number(p.unitPrice || 0),
                precio_venta: Number(p.salePrice || p.unitPrice || 0),
                fecha_vencimiento: p.expiryDate,
                subtotal: Number(p.subtotal || Number(p.quantity || 0) * Number(p.unitPrice || 0)),
            }))
        }),
    });
    return {
        id:            data.id,
        invoiceNumber: `FAC-${String(data.id).padStart(4, "0")}`,
        supplier:      invoiceData.supplierName || String(invoiceData.supplier || ""),
        rtn:           invoiceData.rtn,
        invoiceDate:   invoiceData.invoiceDate,
        total:         invoiceData.total,
        products:      invoiceData.products,
        imageUrl:      null,
    };
}