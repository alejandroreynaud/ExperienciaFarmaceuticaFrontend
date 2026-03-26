import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, FileDown, Package, Truck, X } from "lucide-react";
import {
  getProducts,
  getProductLotsByCode,
  createProduct,
  updateProduct,
  setProductActive,
  updateInventoryLot,
  registerLot,
  getSuppliers,
  createSupplier,
  deleteSupplier,
  exportInventoryPDF,
} from "../services/inventoryService";
import styles from "../styles/Inventory.module.css";

const EMPTY_CATALOG  = {
  name: "",
  code: "",
  image: "",
  description: "",
  supplierId: "",
  quantity: "",
  purchaseDate: "",
  expiryDate: "",
  cost: "",
  price: "",
};
const EMPTY_LOT      = { productId: "", supplierId: "", quantity: "", cost: "", price: "", expiryDate: "" };
const EMPTY_SUPPLIER = { name: "", phone: "" };

function Skeleton({ className }) {
  return <div className={`${styles.skeleton} ${className ?? ""}`} />;
}

export default function Inventory() {
  const [products,   setProducts]   = useState([]);
  const [suppliers,  setSuppliers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [exporting,  setExporting]  = useState(false);
  const [search,     setSearch]     = useState("");

  // Modal catálogo
  const [showCatalog, setShowCatalog] = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [catalogForm, setCatalogForm] = useState(EMPTY_CATALOG);
  const [savingCat,   setSavingCat]   = useState(false);

  // Modal lote
  const [showLot,   setShowLot]   = useState(false);
  const [lotForm,   setLotForm]   = useState(EMPTY_LOT);
  const [savingLot, setSavingLot] = useState(false);

  // Modal proveedores
  const [showSuppliers,  setShowSuppliers]  = useState(false);
  const [supplierForm,   setSupplierForm]   = useState(EMPTY_SUPPLIER);
  const [savingSup,      setSavingSup]      = useState(false);
  const [deletingSupId,  setDeletingSupId]  = useState(null);
  const [supplierPickerContext, setSupplierPickerContext] = useState(null);

  // Modal lotes
  const [showLots,       setShowLots]       = useState(false);
  const [lotsLoading,    setLotsLoading]    = useState(false);
  const [lotsMessage,    setLotsMessage]    = useState("");
  const [lotsProduct,    setLotsProduct]    = useState(null);
  const [productLots,    setProductLots]    = useState([]);
  const [editingLot,     setEditingLot]     = useState(null);
  const [savingEditLot,  setSavingEditLot]  = useState(false);
  const [togglingLotId,  setTogglingLotId]  = useState(null);
  const [togglingProductId, setTogglingProductId] = useState(null);
  const [editLotForm,    setEditLotForm]    = useState({
    quantity: "",
    purchaseDate: "",
    expiryDate: "",
    cost: "",
    price: "",
  });

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getProducts(), getSuppliers()])
      .then(([prods, sups]) => {
        setProducts(prods);
        setSuppliers(sups);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  // ── Catálogo ───────────────────────────────────────────────────────────────
  function handleOpenAdd() {
    const today = new Date().toISOString().slice(0, 10);
    setEditTarget(null);
    setCatalogForm({
      ...EMPTY_CATALOG,
      purchaseDate: today,
      supplierId: suppliers[0]?.id ? String(suppliers[0].id) : "",
    });
    setShowCatalog(true);
  }

  function handleOpenEdit(product) {
    setEditTarget(product);
    setCatalogForm({
      ...EMPTY_CATALOG,
      name: product.name,
      code: product.code,
      image: product.image === "💊" ? "" : product.image,
      description: product.description || "",
      quantity: String(product.quantity ?? ""),
      purchaseDate: product.purchaseDate || new Date().toISOString().slice(0, 10),
      expiryDate: product.expiryDate || "",
      cost: String(product.cost ?? ""),
      price: String(product.price ?? ""),
    });
    setShowCatalog(true);
  }

  async function handleSaveCatalog(e) {
    e.preventDefault();
    setSavingCat(true);
    let createdProduct = null;
    try {
      if (editTarget) {
        const updated = await updateProduct(editTarget.id, catalogForm);

        if (editTarget.lotId) {
          await updateInventoryLot(editTarget.lotId, {
            quantity: catalogForm.quantity,
            expiryDate: catalogForm.expiryDate,
            cost: catalogForm.cost,
            price: catalogForm.price,
          });
        }

        setProducts((prev) =>
          prev.map((p) =>
            p.id === editTarget.id
              ? {
                  ...p,
                  ...updated,
                  description: catalogForm.description,
                  quantity: Number(catalogForm.quantity),
                  purchaseDate: catalogForm.purchaseDate,
                  expiryDate: catalogForm.expiryDate,
                  cost: Number(catalogForm.cost),
                  price: Number(catalogForm.price),
                }
              : p
          )
        );
      } else {
        const purchaseDate = new Date(catalogForm.purchaseDate);
        const expiryDate = new Date(catalogForm.expiryDate);
        const cost = Number(catalogForm.cost);
        const price = Number(catalogForm.price);

        if (
          Number.isNaN(purchaseDate.getTime()) ||
          Number.isNaN(expiryDate.getTime())
        ) {
          alert("Las fechas de compra y vencimiento deben ser válidas.");
          return;
        }

        if (expiryDate.getTime() <= purchaseDate.getTime()) {
          alert("La fecha de vencimiento debe ser posterior a la fecha de compra.");
          return;
        }

        if (!Number.isFinite(cost) || cost < 0) {
          alert("El precio de costo debe ser un número no negativo.");
          return;
        }

        if (!Number.isFinite(price) || price <= 0) {
          alert("El precio de venta debe ser un número positivo.");
          return;
        }

        if (price < cost) {
          alert("El precio de venta no puede ser menor al precio de costo.");
          return;
        }

        createdProduct = await createProduct(catalogForm);
        await registerLot({
          code: createdProduct.code,
          supplierId: catalogForm.supplierId,
          quantity: catalogForm.quantity,
          purchaseDate: catalogForm.purchaseDate,
          expiryDate: catalogForm.expiryDate,
          cost: catalogForm.cost,
          price: catalogForm.price,
          lotActive: true,
        });

        // Keep product and first-lot data consistent in summary.
        const refreshedProducts = await getProducts();
        setProducts(refreshedProducts);
      }
      setShowCatalog(false);
    } catch (error) {
      if (createdProduct) {
        alert(
          "El producto se creo, pero no se pudo registrar su primer lote. Intenta de nuevo desde 'Registrar Lote'."
        );
      } else {
        alert(error?.message || "No se pudo guardar el producto.");
      }
    } finally {
      setSavingCat(false);
    }
  }

  // ── Lote ───────────────────────────────────────────────────────────────────
  function handleOpenLot() {
    setLotForm({
      ...EMPTY_LOT,
      productId: products[0]?.id ?? "",
      supplierId: suppliers[0]?.id ? String(suppliers[0].id) : "",
    });
    setShowLot(true);
  }

  async function handleSaveLot(e) {
    e.preventDefault();
    setSavingLot(true);
    try {
      const selectedProduct = products.find((p) => p.id === Number(lotForm.productId));
      await registerLot({ ...lotForm, code: selectedProduct?.code });
      const refreshedProducts = await getProducts();
      setProducts(refreshedProducts);
      setShowLot(false);
    } finally {
      setSavingLot(false);
    }
  }

  async function handleOpenLots(product) {
    setProductLots([]);
    setLotsMessage("");
    setLotsProduct(product);
    setShowLots(true);
    setLotsLoading(true);
    try {
      const lots = await getProductLotsByCode(product.code);
      setProductLots(lots);
      if (!lots.length) {
        setLotsMessage("Lotes no asociados a ese producto.");
      }
    } catch (error) {
      setProductLots([]);
      setLotsMessage(error?.message || "No se pudieron cargar los lotes de este producto.");
    } finally {
      setLotsLoading(false);
    }
  }

  function handleCloseLots() {
    setShowLots(false);
    setLotsLoading(false);
    setLotsProduct(null);
    setProductLots([]);
    setLotsMessage("");
  }

  async function handleToggleProduct(product) {
    if (product.hasLots || togglingProductId === product.id) return;

    setTogglingProductId(product.id);
    try {
      await setProductActive(product.id, !product.active);
      const refreshedProducts = await getProducts();
      setProducts(refreshedProducts);
    } catch (error) {
      alert(error?.message || "No se pudo cambiar el estado del producto.");
    } finally {
      setTogglingProductId(null);
    }
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("es-HN");
  }

  function toInputDate(value) {
    if (!value) return "";
    return String(value).slice(0, 10);
  }

  function handleOpenEditLot(lot) {
    setEditingLot(lot);
    setEditLotForm({
      quantity: String(lot.quantity ?? ""),
      purchaseDate: toInputDate(lot.purchaseDate),
      expiryDate: toInputDate(lot.expiryDate),
      cost: String(lot.cost ?? ""),
      price: String(lot.price ?? ""),
    });
  }

  function handleCloseEditLot() {
    setEditingLot(null);
    setEditLotForm({
      quantity: "",
      purchaseDate: "",
      expiryDate: "",
      cost: "",
      price: "",
    });
  }

  async function handleSaveEditLot(e) {
    e.preventDefault();
    if (!editingLot || !lotsProduct?.code) return;

    setSavingEditLot(true);
    try {
      await updateInventoryLot(editingLot.id, {
        quantity: editLotForm.quantity,
        expiryDate: editLotForm.expiryDate,
        cost: editLotForm.cost,
        price: editLotForm.price,
      });

      const editedQuantity = Number(editLotForm.quantity);
      setProductLots((prev) =>
        prev.map((lot) =>
          lot.id === editingLot.id
            ? {
                ...lot,
                quantity: editedQuantity,
                expiryDate: editLotForm.expiryDate,
                cost: Number(editLotForm.cost),
                price: Number(editLotForm.price),
                active: editedQuantity > 0 ? lot.active : false,
              }
            : lot
        )
      );

      const [lots, refreshedProducts] = await Promise.all([
        getProductLotsByCode(lotsProduct.code),
        getProducts(),
      ]);

      setProductLots(lots);
      setProducts(refreshedProducts);
      handleCloseEditLot();
    } catch (error) {
      alert(error?.message || "No se pudo actualizar el lote.");
    } finally {
      setSavingEditLot(false);
    }
  }

  async function handleToggleLotStatus(lot) {
    if (togglingLotId === lot.id || !lotsProduct?.code) return;

    setTogglingLotId(lot.id);
    try {
      await updateInventoryLot(lot.id, { lotActive: !lot.active });

      setProductLots((prev) =>
        prev.map((item) =>
          item.id === lot.id
            ? { ...item, active: !lot.active }
            : item
        )
      );

      const [lots, refreshedProducts] = await Promise.all([
        getProductLotsByCode(lotsProduct.code),
        getProducts(),
      ]);

      setProductLots(lots);
      setProducts(refreshedProducts);
    } catch (error) {
      alert(error?.message || "No se pudo cambiar el estado del lote.");
    } finally {
      setTogglingLotId(null);
    }
  }

  // ── Proveedores ────────────────────────────────────────────────────────────
  async function handleSaveSupplier(e) {
    e.preventDefault();
    setSavingSup(true);
    try {
      const created = await createSupplier(supplierForm);
      setSuppliers((prev) => [...prev, created]);

      if (supplierPickerContext === "catalog") {
        setCatalogForm((prev) => ({ ...prev, supplierId: String(created.id) }));
      }
      if (supplierPickerContext === "lot") {
        setLotForm((prev) => ({ ...prev, supplierId: String(created.id) }));
      }

      setSupplierForm(EMPTY_SUPPLIER);
    } finally {
      setSavingSup(false);
    }
  }

  function handleOpenSuppliersFrom(context) {
    setSupplierPickerContext(context);
    setShowSuppliers(true);
  }

  async function handleDeleteSupplier(id) {
    setDeletingSupId(id);
    try {
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeletingSupId(null);
    }
  }

  // ── Exportar ───────────────────────────────────────────────────────────────
  async function handleExport() {
    setExporting(true);
    try {
      await exportInventoryPDF();
      alert("PDF exportado correctamente");
    } finally {
      setExporting(false);
    }
  }

  function qtyClass(qty) {
    if (qty < 50)  return styles.badgeRed;
    if (qty < 100) return styles.badgeOrange;
    return styles.badgeGreen;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Encabezado */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Inventario</h1>
          <p className={styles.subtitle}>Gestiona los productos de la farmacia</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSuccess} onClick={handleExport} disabled={exporting}>
            <FileDown size={18} />
            {exporting ? "Exportando..." : "Exportar PDF"}
          </button>
          <button className={styles.btnTeal} onClick={() => setShowSuppliers(true)}>
            <Truck size={18} />
            Proveedores
          </button>
          <button className={styles.btnSecondary} onClick={handleOpenLot}>
            <Package size={18} />
            Registrar Lote
          </button>
          <button className={styles.btnPrimary} onClick={handleOpenAdd}>
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Código</th>
                <th>Estado</th>
                <th>Descripción</th>
                <th>Costo</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Vencimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td><Skeleton className={styles.skeletonImg} /></td>
                      <td><Skeleton className={styles.skeletonText} /></td>
                      <td><Skeleton className={styles.skeletonTextSm} /></td>
                      <td><Skeleton className={styles.skeletonText} /></td>
                      <td><Skeleton className={styles.skeletonTextSm} /></td>
                      <td><Skeleton className={styles.skeletonTextSm} /></td>
                      <td><Skeleton className={styles.skeletonBadge} /></td>
                      <td><Skeleton className={styles.skeletonTextSm} /></td>
                      <td><Skeleton className={styles.skeletonActions} /></td>
                    </tr>
                  ))
                : filtered.length === 0
                ? <tr><td colSpan={10} className={styles.emptyRow}>No se encontraron productos</td></tr>
                : filtered.map((p) => (
                    <tr key={p.id}>
                      <td><div className={styles.productImage}>{p.image}</div></td>
                      <td className={styles.productName}>{p.name}</td>
                      <td className={styles.muted}>{p.code}</td>
                      <td>
                        {p.hasLots ? (
                          <div className={styles.statusCell}>
                            <span
                              className={`${styles.badge} ${p.active === false ? styles.badgeRed : styles.badgeGreen}`}
                              title="Estado informativo (FEFO). Cambios solo desde Ver lotes"
                            >
                              {p.active === false ? "Inactivo" : "Activo"}
                            </span>
                          </div>
                        ) : (
                          <div className={styles.statusCell}>
                            <button
                              type="button"
                              className={`${styles.badge} ${p.active === false ? styles.badgeRed : styles.badgeGreen} ${styles.statusToggle}`}
                              onClick={() => handleToggleProduct(p)}
                              disabled={togglingProductId === p.id}
                              title="Producto sin lotes asociados. Click para cambiar estado"
                            >
                              {p.active === false ? "Inactivo" : "Activo"}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className={styles.description}>{p.description}</td>
                      <td className={styles.muted}>L. {Number(p.cost).toFixed(2)}</td>
                      <td className={styles.price}>L. {Number(p.price).toFixed(2)}</td>
                      <td>
                        <span className={`${styles.badge} ${qtyClass(p.quantity)}`}>
                          {p.quantity}
                        </span>
                      </td>
                      <td className={styles.muted}>{p.expiryDate || "—"}</td>
                      <td>
                        <div className={styles.actions}>
                          <button className={styles.btnLot} onClick={() => handleOpenLots(p)} title="Ver lotes">
                            Ver lotes
                          </button>
                          <button className={styles.btnEdit} onClick={() => handleOpenEdit(p)} title="Editar">
                            <Edit2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Catálogo ── */}
      {showCatalog && (
        <div className={styles.modalOverlay} onClick={() => setShowCatalog(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editTarget ? "Editar Producto" : "Nuevo Producto (incluye primer lote)"}</h2>
              <button className={styles.modalClose} onClick={() => setShowCatalog(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveCatalog} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Nombre del Producto</label>
                  <input type="text" value={catalogForm.name} onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })} placeholder="Paracetamol 500mg" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Código</label>
                  <input type="text" value={catalogForm.code} onChange={(e) => setCatalogForm({ ...catalogForm, code: e.target.value })} placeholder="MED-001" required />
                </div>
                <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                  <label>Imagen (URL, opcional)</label>
                  <input type="url" value={catalogForm.image} onChange={(e) => setCatalogForm({ ...catalogForm, image: e.target.value })} placeholder="https://ejemplo.com/imagen.jpg" />
                </div>
                <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                  <label>Descripción</label>
                  <input type="text" value={catalogForm.description} onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })} placeholder="Descripción del producto" />
                </div>
                {!editTarget && (
                  <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                    <label>Proveedor</label>
                    <div className={styles.inlineFieldActions}>
                      <select
                        value={catalogForm.supplierId}
                        onChange={(e) => setCatalogForm({ ...catalogForm, supplierId: e.target.value })}
                        required
                      >
                        <option value="">Selecciona un proveedor...</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={styles.btnOutline}
                        onClick={() => handleOpenSuppliersFrom("catalog")}
                      >
                        Agregar proveedor
                      </button>
                    </div>
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label>{editTarget ? "Cantidad" : "Cantidad Inicial"}</label>
                  <input type="number" min="0" value={catalogForm.quantity} onChange={(e) => setCatalogForm({ ...catalogForm, quantity: e.target.value })} placeholder="0" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Fecha de Compra</label>
                  <input
                    type="date"
                    value={catalogForm.purchaseDate}
                    onChange={(e) => setCatalogForm({ ...catalogForm, purchaseDate: e.target.value })}
                    required={!editTarget}
                    disabled={Boolean(editTarget)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Fecha de Vencimiento</label>
                  <input type="date" value={catalogForm.expiryDate} onChange={(e) => setCatalogForm({ ...catalogForm, expiryDate: e.target.value })} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Precio de Costo (L.)</label>
                  <input type="number" step="0.01" min="0" value={catalogForm.cost} onChange={(e) => setCatalogForm({ ...catalogForm, cost: e.target.value })} placeholder="0.00" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Precio de Venta (L.)</label>
                  <input type="number" step="0.01" min="0" value={catalogForm.price} onChange={(e) => setCatalogForm({ ...catalogForm, price: e.target.value })} placeholder="0.00" required />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowCatalog(false)}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary} disabled={savingCat}>
                  {savingCat ? "Guardando..." : editTarget ? "Guardar Cambios" : "Agregar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Lote ── */}
      {showLot && (
        <div className={styles.modalOverlay} onClick={() => setShowLot(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Registrar Lote</h2>
              <button className={styles.modalClose} onClick={() => setShowLot(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveLot} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                  <label>Producto</label>
                  <select value={lotForm.productId} onChange={(e) => setLotForm({ ...lotForm, productId: e.target.value })} required>
                    <option value="">Selecciona un producto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                    ))}
                  </select>
                </div>
                <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                  <label>Proveedor</label>
                  <div className={styles.inlineFieldActions}>
                    <select value={lotForm.supplierId} onChange={(e) => setLotForm({ ...lotForm, supplierId: e.target.value })} required>
                      <option value="">Selecciona un proveedor...</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={styles.btnOutline}
                      onClick={() => handleOpenSuppliersFrom("lot")}
                    >
                      Agregar proveedor
                    </button>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Cantidad</label>
                  <input type="number" min="1" value={lotForm.quantity} onChange={(e) => setLotForm({ ...lotForm, quantity: e.target.value })} placeholder="0" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Fecha de Vencimiento</label>
                  <input type="date" value={lotForm.expiryDate} onChange={(e) => setLotForm({ ...lotForm, expiryDate: e.target.value })} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Costo unitario (L.)</label>
                  <input type="number" step="0.01" min="0" value={lotForm.cost} onChange={(e) => setLotForm({ ...lotForm, cost: e.target.value })} placeholder="0.00" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Precio de venta (L.)</label>
                  <input type="number" step="0.01" min="0" value={lotForm.price} onChange={(e) => setLotForm({ ...lotForm, price: e.target.value })} placeholder="0.00" required />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowLot(false)}>Cancelar</button>
                <button type="submit" className={styles.btnSecondary} disabled={savingLot}>
                  {savingLot ? "Registrando..." : "Registrar Lote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Proveedores ── */}
      {showSuppliers && (
        <div className={styles.modalOverlay} onClick={() => { setShowSuppliers(false); setSupplierPickerContext(null); }}>
          <div className={styles.modalWide} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Proveedores</h2>
              <button className={styles.modalClose} onClick={() => { setShowSuppliers(false); setSupplierPickerContext(null); }}><X size={20} /></button>
            </div>
            <div className={styles.suppliersBody}>

              {/* Formulario agregar proveedor */}
              <form onSubmit={handleSaveSupplier} className={styles.supplierForm}>
                <div className={styles.supplierFormGrid}>
                  <div className={styles.formGroup}>
                    <label>Nombre del Proveedor</label>
                    <input
                      type="text"
                      value={supplierForm.name}
                      onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                      placeholder="Distribuidora Médica SA"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Teléfono</label>
                    <input
                      type="text"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                      placeholder="2221-0001"
                      required
                    />
                  </div>
                  <div className={styles.supplierAddBtn}>
                    <button type="submit" className={styles.btnPrimary} disabled={savingSup}>
                      <Plus size={16} />
                      {savingSup ? "Agregando..." : "Agregar"}
                    </button>
                  </div>
                </div>
              </form>

              {/* Tabla de proveedores */}
              <div className={styles.tableCard}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Teléfono</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.length === 0
                        ? <tr><td colSpan={3} className={styles.emptyRow}>No hay proveedores registrados</td></tr>
                        : suppliers.map((s) => (
                            <tr key={s.id}>
                              <td className={styles.productName}>{s.name}</td>
                              <td className={styles.muted}>{s.phone}</td>
                              <td>
                                <button
                                  className={styles.btnDelete}
                                  onClick={() => handleDeleteSupplier(s.id)}
                                  disabled={deletingSupId === s.id}
                                  title="Eliminar proveedor"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Modal Lotes por Producto ── */}
      {showLots && (
        <div className={styles.modalOverlay} onClick={handleCloseLots}>
          <div className={styles.modalWide} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                Lotes de {lotsProduct?.name} ({lotsProduct?.code})
              </h2>
              <button className={styles.modalClose} onClick={handleCloseLots}><X size={20} /></button>
            </div>
            <div className={styles.suppliersBody}>
              <div className={styles.tableCard}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID Lote</th>
                        <th>Estado</th>
                        <th>Cantidad</th>
                        <th>Cantidad Inicial</th>
                        <th>Compra</th>
                        <th>Vencimiento</th>
                        <th>Costo</th>
                        <th>Precio</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lotsLoading ? (
                        <tr><td colSpan={9} className={styles.emptyRow}>Cargando lotes...</td></tr>
                      ) : productLots.length === 0 ? (
                        <tr><td colSpan={9} className={styles.emptyRow}>{lotsMessage || "Lotes no asociados a ese producto."}</td></tr>
                      ) : (
                        productLots.map((lot) => (
                          <tr key={lot.id}>
                            <td className={styles.muted}>#{lot.id}</td>
                            <td>
                              <button
                                type="button"
                                className={`${styles.badge} ${lot.active ? styles.badgeGreen : styles.badgeRed} ${styles.statusToggle}`}
                                onClick={() => handleToggleLotStatus(lot)}
                                disabled={togglingLotId === lot.id}
                                title="Click para cambiar estado del lote"
                              >
                                {lot.active ? "Activo" : "Inactivo"}
                              </button>
                            </td>
                            <td>{lot.quantity}</td>
                            <td>{lot.initialQuantity}</td>
                            <td className={styles.muted}>{formatDate(lot.purchaseDate)}</td>
                            <td className={styles.muted}>{formatDate(lot.expiryDate)}</td>
                            <td className={styles.muted}>L. {Number(lot.cost).toFixed(2)}</td>
                            <td className={styles.price}>L. {Number(lot.price).toFixed(2)}</td>
                            <td>
                              <button
                                className={styles.btnEdit}
                                onClick={() => handleOpenEditLot(lot)}
                                title={`Editar lote #${lot.id}`}
                              >
                                <Edit2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnOutline} onClick={handleCloseLots}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar Lote ── */}
      {editingLot && (
        <div className={styles.modalOverlay} onClick={handleCloseEditLot}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Editar lote #{editingLot.id}</h2>
              <button className={styles.modalClose} onClick={handleCloseEditLot}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEditLot} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Cantidad</label>
                  <input
                    type="number"
                    min="0"
                    value={editLotForm.quantity}
                    onChange={(e) => setEditLotForm({ ...editLotForm, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Fecha de Compra</label>
                  <input type="date" value={editLotForm.purchaseDate} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label>Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={editLotForm.expiryDate}
                    onChange={(e) => setEditLotForm({ ...editLotForm, expiryDate: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Precio de Costo (L.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editLotForm.cost}
                    onChange={(e) => setEditLotForm({ ...editLotForm, cost: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Precio de Venta (L.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editLotForm.price}
                    onChange={(e) => setEditLotForm({ ...editLotForm, price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnOutline} onClick={handleCloseEditLot}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary} disabled={savingEditLot}>
                  {savingEditLot ? "Guardando..." : "Guardar lote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
