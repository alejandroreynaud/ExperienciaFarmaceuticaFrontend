import { apiRequest } from "./api";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeProduct(product) {
  return {
    id: product?.id ?? product?._id,
    image: product?.image || product?.imagen || "💊",
    name: product?.name || product?.nombre || "",
    code: product?.code || product?.codigo || "",
    active: product?.active ?? product?.activo ?? true,
    description: product?.description || "",
    quantity: toNumber(product?.quantity ?? product?.stock, 0),
    cost: toNumber(product?.cost ?? product?.unitCost, 0),
    price: toNumber(product?.price ?? product?.salePrice, 0),
    expiryDate: product?.expiryDate || product?.expirationDate || "",
  };
}

function normalizeSupplier(supplier) {
  return {
    id: supplier?.id ?? supplier?._id,
    name: supplier?.name || supplier?.nombre || "",
    phone: supplier?.phone || supplier?.telefono || supplier?.phoneNumber || "",
  };
}

export async function getProducts() {
  const [productsData, inventoryData] = await Promise.all([
    apiRequest("/productos"),
    apiRequest("/inventory/products").catch(() => ({ data: [] })),
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
      quantity: 0,
      cost: 0,
      price: 0,
      expiryDate: "",
    };

    current.quantity += toNumber(lot?.cantidad, 0);

    const lotExpiry = lot?.fecha_vencimiento || "";
    if (!current.expiryDate || (lotExpiry && lotExpiry < current.expiryDate)) {
      current.expiryDate = lotExpiry;
      current.cost = toNumber(lot?.precio_costo, current.cost);
      current.price = toNumber(lot?.precio_venta, current.price);
    }

    inventoryByCode.set(code, current);
  }

  return products.map((product) => {
    const base = normalizeProduct(product);
    const inventory = inventoryByCode.get(base.code);
    return inventory ? { ...base, ...inventory } : base;
  });
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
  };

  const updated = await apiRequest(`/productos/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return normalizeProduct(updated?.data || updated);
}

export async function deleteProduct(id) {
  await apiRequest(`/productos/desactivar/${id}`, { method: "PUT" });
  return { success: true, id };
}

export async function registerLot(data) {
  const payload = {
    codigo: data?.code,
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

export async function exportInventoryPDF() {
  await apiRequest("/inventory/export/pdf");
  return { success: true };
}
