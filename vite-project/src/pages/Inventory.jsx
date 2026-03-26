import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, FileDown, Package, Truck, X } from "lucide-react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
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
  quantity: "",
  purchaseDate: "",
  expiryDate: "",
  cost: "",
  price: "",
};
const EMPTY_LOT      = { productId: "", quantity: "", cost: "", price: "", expiryDate: "" };
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

  // Modal eliminar producto
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

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
    setCatalogForm({ ...EMPTY_CATALOG, purchaseDate: today });
    setShowCatalog(true);
  }

  function handleOpenEdit(product) {
    setEditTarget(product);
    setCatalogForm({
      ...EMPTY_CATALOG,
      name: product.name,
      code: product.code,
      image: product.image === "💊" ? "" : product.image,
    });
    setShowCatalog(true);
  }

  async function handleSaveCatalog(e) {
    e.preventDefault();
    setSavingCat(true);
    try {
      if (editTarget) {
        const updated = await updateProduct(editTarget.id, catalogForm);
        setProducts((prev) => prev.map((p) => (p.id === editTarget.id ? { ...p, ...updated } : p)));
      } else {
        const created = await createProduct(catalogForm);
        await registerLot({
          code: created.code,
          quantity: catalogForm.quantity,
          purchaseDate: catalogForm.purchaseDate,
          expiryDate: catalogForm.expiryDate,
          cost: catalogForm.cost,
          price: catalogForm.price,
          lotActive: true,
        });
        setProducts((prev) => [
          ...prev,
          {
            ...created,
            quantity: Number(catalogForm.quantity),
            cost: Number(catalogForm.cost),
            price: Number(catalogForm.price),
            expiryDate: catalogForm.expiryDate,
          },
        ]);
      }
      setShowCatalog(false);
    } finally {
      setSavingCat(false);
    }
  }

  // ── Lote ───────────────────────────────────────────────────────────────────
  function handleOpenLot() {
    setLotForm({ ...EMPTY_LOT, productId: products[0]?.id ?? "" });
    setShowLot(true);
  }

  async function handleSaveLot(e) {
    e.preventDefault();
    setSavingLot(true);
    try {
      const selectedProduct = products.find((p) => p.id === Number(lotForm.productId));
      await registerLot({ ...lotForm, code: selectedProduct?.code });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === Number(lotForm.productId)
            ? { ...p, quantity: p.quantity + Number(lotForm.quantity), cost: Number(lotForm.cost), price: Number(lotForm.price), expiryDate: lotForm.expiryDate }
            : p
        )
      );
      setShowLot(false);
    } finally {
      setSavingLot(false);
    }
  }

  // ── Eliminar producto ──────────────────────────────────────────────────────
  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      setProducts((prev) => prev.map((p) => (p.id === deleteTarget.id ? { ...p, active: false } : p)));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  // ── Proveedores ────────────────────────────────────────────────────────────
  async function handleSaveSupplier(e) {
    e.preventDefault();
    setSavingSup(true);
    try {
      const created = await createSupplier(supplierForm);
      setSuppliers((prev) => [...prev, created]);
      setSupplierForm(EMPTY_SUPPLIER);
    } finally {
      setSavingSup(false);
    }
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
                        <span className={`${styles.badge} ${p.active === false ? styles.badgeRed : styles.badgeGreen}`}>
                          {p.active === false ? "Inactivo" : "Activo"}
                        </span>
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
                          <button className={styles.btnEdit} onClick={() => handleOpenEdit(p)} title="Editar">
                            <Edit2 size={15} />
                          </button>
                          <button className={styles.btnDelete} onClick={() => setDeleteTarget(p)} title="Desactivar" disabled={p.active === false}>
                            <Trash2 size={15} />
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
              <h2 className={styles.modalTitle}>{editTarget ? "Editar Producto" : "Nuevo Producto"}</h2>
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
                {!editTarget && (
                  <>
                    <div className={styles.formGroup}>
                      <label>Cantidad Inicial</label>
                      <input type="number" min="1" value={catalogForm.quantity} onChange={(e) => setCatalogForm({ ...catalogForm, quantity: e.target.value })} placeholder="0" required />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Fecha de Compra</label>
                      <input type="date" value={catalogForm.purchaseDate} onChange={(e) => setCatalogForm({ ...catalogForm, purchaseDate: e.target.value })} required />
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
                  </>
                )}
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
        <div className={styles.modalOverlay} onClick={() => setShowSuppliers(false)}>
          <div className={styles.modalWide} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Proveedores</h2>
              <button className={styles.modalClose} onClick={() => setShowSuppliers(false)}><X size={20} /></button>
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

      {/* ── Modal Confirmar Eliminación de Producto ── */}
      {deleteTarget && (
        <div className={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modalConfirm} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}><Trash2 size={28} color="#dc2626" /></div>
            <h3 className={styles.confirmTitle}>Retirar producto?</h3>
            <p className={styles.confirmMsg}>
              Estás a punto de retirar <strong>{deleteTarget.name}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.btnOutline} onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className={styles.btnDanger} onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? "Retirando..." : "Sí, retirar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
