import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, FileDown, Filter, X } from "lucide-react";
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  exportInventoryPDF,
} from "../services/inventoryService";
import styles from "../styles/Inventory.module.css";

// ── Formulario vacío reutilizable ────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
  cost: "",
  price: "",
  quantity: "",
  category: "Analgésicos",
  expiryDate: "",
};

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return <div className={`${styles.skeleton} ${className ?? ""}`} />;
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Inventory() {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [exporting,  setExporting]  = useState(false);

  // Filtros
  const [searchTerm,     setSearchTerm]     = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal agregar / editar
  const [showModal,   setShowModal]   = useState(false);
  const [editProduct, setEditProduct] = useState(null); // null = modo agregar
  const [formData,    setFormData]    = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);

  // Modal confirmar eliminación
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Filtrado local ─────────────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // ── Abrir modal agregar ────────────────────────────────────────────────────
  function handleOpenAdd() {
    setEditProduct(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  }

  // ── Abrir modal editar ─────────────────────────────────────────────────────
  function handleOpenEdit(product) {
    setEditProduct(product);
    setFormData({
      name:        product.name,
      code:        product.code,
      description: product.description,
      cost:        product.cost,
      price:       product.price,
      quantity:    product.quantity,
      category:    product.category,
      expiryDate:  product.expiryDate,
    });
    setShowModal(true);
  }

  // ── Guardar (crear o editar) ───────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editProduct) {
        const updated = await updateProduct(editProduct.id, formData);
        setProducts((prev) =>
          prev.map((p) => (p.id === editProduct.id ? { ...p, ...updated } : p))
        );
      } else {
        const created = await createProduct(formData);
        setProducts((prev) => [...prev, created]);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  }

  // ── Confirmar eliminación ──────────────────────────────────────────────────
  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  // ── Exportar PDF ───────────────────────────────────────────────────────────
  async function handleExportPDF() {
    setExporting(true);
    try {
      await exportInventoryPDF();
      // TODO: cuando el backend devuelva un blob, reemplazar por:
      // const blob = await exportInventoryPDF();
      // const url = URL.createObjectURL(blob);
      // window.open(url);
      alert("PDF exportado correctamente");
    } finally {
      setExporting(false);
    }
  }

  // ── Badge de cantidad ──────────────────────────────────────────────────────
  function quantityBadgeClass(qty) {
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
          <button
            className={styles.btnSecondary}
            onClick={handleExportPDF}
            disabled={exporting}
          >
            <FileDown size={18} />
            {exporting ? "Exportando..." : "Exportar PDF"}
          </button>
          <button className={styles.btnPrimary} onClick={handleOpenAdd}>
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.selectWrap}>
          <Filter size={18} className={styles.selectIcon} />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.select}
          >
            <option value="all">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
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
                <th>Descripción</th>
                <th>Costo</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Categoría</th>
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
                      <td><Skeleton className={styles.skeletonText} /></td>
                      <td><Skeleton className={styles.skeletonTextSm} /></td>
                      <td><Skeleton className={styles.skeletonActions} /></td>
                    </tr>
                  ))
                : filtered.length === 0
                ? (
                    <tr>
                      <td colSpan={10} className={styles.emptyRow}>
                        No se encontraron productos
                      </td>
                    </tr>
                  )
                : filtered.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className={styles.productImage}>
                          {product.image}
                        </div>
                      </td>
                      <td className={styles.productName}>{product.name}</td>
                      <td className={styles.muted}>{product.code}</td>
                      <td className={styles.description}>{product.description}</td>
                      <td className={styles.muted}>L. {Number(product.cost).toFixed(2)}</td>
                      <td className={styles.price}>L. {Number(product.price).toFixed(2)}</td>
                      <td>
                        <span className={`${styles.badge} ${quantityBadgeClass(product.quantity)}`}>
                          {product.quantity}
                        </span>
                      </td>
                      <td className={styles.muted}>{product.category}</td>
                      <td className={styles.muted}>{product.expiryDate}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.btnEdit}
                            onClick={() => handleOpenEdit(product)}
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className={styles.btnDelete}
                            onClick={() => setDeleteTarget(product)}
                            title="Eliminar"
                          >
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

      {/* ── Modal agregar / editar ── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editProduct ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className={styles.modalForm}>
              <div className={styles.formGrid}>

                <div className={styles.formGroup}>
                  <label>Nombre del Producto</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Código</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                  <label>Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Costo (L.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Precio (L.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Cantidad</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    required
                  />
                </div>

              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnOutline}
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : editProduct ? "Guardar Cambios" : "Agregar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal confirmar eliminación ── */}
      {deleteTarget && (
        <div className={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modalConfirm} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <Trash2 size={28} color="#dc2626" />
            </div>
            <h3 className={styles.confirmTitle}>¿Eliminar producto?</h3>
            <p className={styles.confirmMsg}>
              Estás a punto de eliminar <strong>{deleteTarget.name}</strong>.
              Esta acción no se puede deshacer.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.btnOutline}
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </button>
              <button
                className={styles.btnDanger}
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
