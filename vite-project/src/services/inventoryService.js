import { apiRequest } from "./api";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  return fallback;
}

function normalizeProduct(product) {
  return {
    id: product?.id ?? product?._id,
    image: product?.image || product?.imagen || "💊",
    name: product?.name || product?.nombre || "",
    code: product?.code || product?.codigo || "",
    active: toBoolean(product?.active ?? product?.activo, true),
    description: product?.description || product?.descripcion || "",
    quantity: toNumber(product?.quantity ?? product?.stock, 0),
    cost: toNumber(product?.cost ?? product?.unitCost, 0),
    price: toNumber(product?.price ?? product?.salePrice, 0),
    expiryDate: product?.expiryDate || product?.expirationDate || "",
    purchaseDate: product?.purchaseDate || product?.fecha_compra || "",
    lotId: product?.lotId || null,
    hasLots: Boolean(product?.hasLots),
    lotCount: toNumber(product?.lotCount, 0),
  };
}

function normalizeSupplier(supplier) {
  return {
    id: supplier?.id ?? supplier?._id,
    name: supplier?.name || supplier?.nombre || "",
    phone: supplier?.phone || supplier?.telefono || supplier?.phoneNumber || "",
  };
}

function normalizeLot(lot) {
  const quantity = toNumber(lot?.cantidad, 0);
  const apiActive = toBoolean(lot?.lote_activo, true);
  return {
    id: lot?.id ?? lot?._id,
    quantity,
    initialQuantity: toNumber(lot?.cantidad_inicial, 0),
    purchaseDate: lot?.fecha_compra || "",
    expiryDate: lot?.fecha_vencimiento || "",
    active: apiActive && quantity > 0,
    cost: toNumber(lot?.precio_costo, 0),
    price: toNumber(lot?.precio_venta, 0),
  };
}

function buildInventoryQuery(filters = {}) {
  const params = new URLSearchParams();
  const append = (key, value) => {
    if (value === undefined || value === null) return;
    const text = String(value).trim();
    if (!text) return;
    params.set(key, text);
  };

  append("estado_producto", filters.productStatus);
  append("estado_lote", filters.lotStatus);
  append("id_prov", filters.supplierId);
  append("vence_desde", filters.expiryFrom);
  append("vence_hasta", filters.expiryTo);
  append("stock_min", filters.stockMin);
  append("stock_max", filters.stockMax);
  append("precio_min", filters.priceMin);
  append("precio_max", filters.priceMax);

  const query = params.toString();
  return query ? `/inventory/products?${query}` : "/inventory/products";
}

function hasLotLevelFilters(filters = {}) {
  return [
    filters.lotStatus,
    filters.supplierId,
    filters.expiryFrom,
    filters.expiryTo,
    filters.stockMin,
    filters.stockMax,
    filters.priceMin,
    filters.priceMax,
  ].some((value) => String(value ?? "").trim() !== "");
}

export async function getProducts(filters = {}) {
  const inventoryPath = buildInventoryQuery(filters);
  const [productsData, inventoryData] = await Promise.all([
    apiRequest("/productos"),
    apiRequest(inventoryPath).catch(() => ({ data: [] })),
  ]);

  const products = Array.isArray(productsData)
    ? productsData
    : productsData?.data || [];

  const lots = Array.isArray(inventoryData)
    ? inventoryData
    : inventoryData?.data || [];

  const inventoryByCode = new Map();

  for (const lot of lots) {
    const code = lot?.Producto?.codigo;
    if (!code) continue;

    const current = inventoryByCode.get(code) || {
      active: false,
      quantity: 0,
      cost: 0,
      price: 0,
      expiryDate: "",
      purchaseDate: "",
      lotId: null,
      lotCount: 0,
      hasLots: false,
      _fefoActiveExpiry: "",
      _fefoAnyExpiry: "",
      _fefoActivePurchase: "",
      _fefoAnyPurchase: "",
      _fefoActiveLotId: null,
      _fefoAnyLotId: null,
      _fefoActiveCost: 0,
      _fefoAnyCost: 0,
      _fefoActivePrice: 0,
      _fefoAnyPrice: 0,
    };

    current.lotCount += 1;
    current.hasLots = true;

    const lotQuantity = toNumber(lot?.cantidad, 0);
    const isActiveLot = toBoolean(lot?.lote_activo, true);
    const hasStock = lotQuantity > 0;

    if (isActiveLot && hasStock) {
      current.active = true;
    }

    // Stock in summary reflects physical inventory, not sale status.
    // Toggling active/inactive must not change quantity.
    if (hasStock) {
      current.quantity += lotQuantity;

      const lotExpiry = lot?.fecha_vencimiento || "";
      if (!current._fefoAnyExpiry || (lotExpiry && lotExpiry < current._fefoAnyExpiry)) {
        current._fefoAnyExpiry = lotExpiry;
        current._fefoAnyPurchase = lot?.fecha_compra || current._fefoAnyPurchase;
        current._fefoAnyLotId = lot?.id ?? current._fefoAnyLotId;
        current._fefoAnyCost = toNumber(lot?.precio_costo, current._fefoAnyCost);
        current._fefoAnyPrice = toNumber(lot?.precio_venta, current._fefoAnyPrice);
      }

      if (isActiveLot && (!current._fefoActiveExpiry || (lotExpiry && lotExpiry < current._fefoActiveExpiry))) {
        current._fefoActiveExpiry = lotExpiry;
        current._fefoActivePurchase = lot?.fecha_compra || current._fefoActivePurchase;
        current._fefoActiveLotId = lot?.id ?? current._fefoActiveLotId;
        current._fefoActiveCost = toNumber(lot?.precio_costo, current._fefoActiveCost);
        current._fefoActivePrice = toNumber(lot?.precio_venta, current._fefoActivePrice);
      }
    }

    inventoryByCode.set(code, current);
  }

  let merged = products.map((product) => {
    const base = normalizeProduct(product);
    const inventory = inventoryByCode.get(base.code);
    if (!inventory) return base;

    const hasActiveFefo = Boolean(inventory._fefoActiveExpiry);
    const expiryDate = hasActiveFefo ? inventory._fefoActiveExpiry : inventory._fefoAnyExpiry;
    const purchaseDate = hasActiveFefo ? inventory._fefoActivePurchase : inventory._fefoAnyPurchase;
    const lotId = hasActiveFefo ? inventory._fefoActiveLotId : inventory._fefoAnyLotId;
    const cost = hasActiveFefo ? inventory._fefoActiveCost : inventory._fefoAnyCost;
    const price = hasActiveFefo ? inventory._fefoActivePrice : inventory._fefoAnyPrice;

    return {
      ...base,
      hasLots: inventory.hasLots,
      lotCount: inventory.lotCount,
      quantity: inventory.quantity,
      expiryDate,
      purchaseDate,
      lotId,
      cost,
      price,
      // For products with lots, summary status is driven by lots.
      active: inventory.hasLots ? inventory.active : base.active,
    };
  });

  if (String(filters.productStatus || "").trim() === "activo") {
    merged = merged.filter((p) => p.active === true);
  }
  if (String(filters.productStatus || "").trim() === "inactivo") {
    merged = merged.filter((p) => p.active === false);
  }

  if (hasLotLevelFilters(filters)) {
    const codesWithLots = new Set(Array.from(inventoryByCode.keys()));
    merged = merged.filter((p) => codesWithLots.has(p.code));
  }

  return merged;
}

export async function createProduct(data) {
  const payload = {
    nombre: data?.name,
    codigo: data?.code,
    imagen: data?.image || null,
  };

  const created = await apiRequest("/productos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeProduct(created?.data || created);
}

export async function updateProduct(id, data) {
  const payload = {
    nombre: data?.name,
    codigo: data?.code,
    imagen: data?.image || null,
    descripcion: data?.description || "",
  };

  const updated = await apiRequest(`/productos/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return normalizeProduct(updated?.data || updated);
}

export async function updateInventoryLot(id, data) {
  const payload = {
    ...(data?.quantity !== undefined ? { cantidad: toNumber(data.quantity) } : {}),
    ...(data?.expiryDate !== undefined ? { fecha_vencimiento: data.expiryDate } : {}),
    ...(data?.cost !== undefined ? { precio_costo: toNumber(data.cost) } : {}),
    ...(data?.price !== undefined ? { precio_venta: toNumber(data.price) } : {}),
    ...(data?.lotActive !== undefined ? { lote_activo: Boolean(data.lotActive) } : {}),
  };

  const updated = await apiRequest(`/inventory/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return updated?.data || updated;
}

export async function setProductActive(id, active) {
  const url = active ? `/productos/activar/${id}` : `/productos/desactivar/${id}`;
  const updated = await apiRequest(url, { method: "PUT" });
  return normalizeProduct(updated?.data || updated);
}

export async function deleteProduct(id) {
  await setProductActive(id, false);
  return { success: true, id };
}

export async function registerLot(data) {
  const payload = {
    codigo: data?.code,
    id_prov: toNumber(data?.supplierId),
    cantidad: toNumber(data.quantity),
    fecha_compra: data?.purchaseDate || new Date().toISOString().slice(0, 10),
    fecha_vencimiento: data?.expiryDate,
    lote_activo: data?.lotActive !== undefined ? Boolean(data.lotActive) : true,
    precio_costo: toNumber(data.cost),
    precio_venta: toNumber(data.price),
  };

  const result = await apiRequest("/inventory/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return result?.data || result;
}

export async function getProductLotsByCode(code) {
  try {
    const response = await apiRequest(`/inventory/products/${code}`);
    const payload = response?.data || response;
    const lots = Array.isArray(payload?.lotes)
      ? payload.lotes
      : Array.isArray(payload?.data?.lotes)
        ? payload.data.lotes
        : [];

    return lots.map(normalizeLot);
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("no hay registros de inventario para el codigo enviado")) {
      return [];
    }
    throw error;
  }
}

export async function getSuppliers() {
  const data = await apiRequest("/proovedores");
  const list = Array.isArray(data) ? data : data?.data || [];
  return list.map(normalizeSupplier);
}

export async function createSupplier(data) {
  const payload = {
    nombre: data?.name,
    telefono: data?.phone,
  };

  const created = await apiRequest("/proovedores", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeSupplier(created?.data || created);
}

export async function deleteSupplier(id) {
  await apiRequest(`/proovedores/${id}`, { method: "DELETE" });
  return { success: true, id };
}

export async function exportInventoryPDF(filters = {}) {
  const baseUrl = import.meta.env.VITE_API_URL || "/api";
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const query = buildInventoryQuery(filters).replace("/inventory/products", "");
  const url = `${normalizedBase}/inventory/export/pdf${query}`;

  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (!response.ok) {
    let message = `Error exportando inventario (status ${response.status})`;
    try {
      const payload = await response.json();
      message = payload?.message || payload?.error || message;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;

  const disposition = response.headers.get("content-disposition") || "";
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
  link.download = filenameMatch?.[1] || "inventario-completo.pdf";

  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);

  return { success: true };
}
