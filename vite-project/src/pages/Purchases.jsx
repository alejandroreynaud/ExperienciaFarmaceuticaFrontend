import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Trash2, Upload, X, Eye, FileText } from "lucide-react";
import {
  getInvoices,
  getSuppliers,
  getAvailableProducts,
  createInvoice,
  createSupplier,
  createProductFromPurchases,
  getPurchasesSummary,
} from "../services/purchasesService";
import styles from "../styles/Purchases.module.css";

const EMPTY_FORM = {
  invoiceNumber: "",
  supplier:      "",
  rtn:           "",
  invoiceDate:   new Date().toISOString().split("T")[0],
  paymentMethod: "efectivo",
  total:         "",
};

const EMPTY_PRODUCT_ROW_WITH_PRICE = {
  productId: "",
  quantity: "",
  unitPrice: "",
  salePrice: "",
  expiryDate: "",
};

function Skeleton({ className }) {
  return <div className={`${styles.skeleton} ${className ?? ""}`} />;
}

export default function Purchases() {
  const [invoices,  setInvoices]  = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [catalog,   setCatalog]   = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [loading,   setLoading]   = useState(true);

  const [search, setSearch] = useState("");

  // Modal nueva factura
  const [showModal,    setShowModal]    = useState(false);
  const [formData,     setFormData]     = useState(EMPTY_FORM);
  const [invoiceProds, setInvoiceProds] = useState([]);
  const [currentRow,   setCurrentRow]   = useState(EMPTY_PRODUCT_ROW_WITH_PRICE);
  const [invoiceImage, setInvoiceImage] = useState(null);
  const [saving,       setSaving]       = useState(false);

  // Modal detalle
  const [selectedInvoice, setSelectedInvoice] = useState(null);


  // Mini formulario proveedor
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [newSupplier,      setNewSupplier]      = useState({ nombre: "", telefono: "" });
  const [savingSupplier,   setSavingSupplier]   = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ code: "", name: "", image: "" });
  const [savingProduct, setSavingProduct] = useState(false);

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      getInvoices(),
      getSuppliers(),
      getAvailableProducts(),
      getPurchasesSummary(),
    ]).then(([inv, sup, cat, sum]) => {
      setInvoices(inv);
      setSuppliers(sup);
      setCatalog(cat);
      setSummary(sum);
    }).finally(() => setLoading(false));
  }, []);

  const productsTotal = useMemo(
    () => invoiceProds.reduce((acc, p) => acc + Number(p.subtotal || 0), 0),
    [invoiceProds],
  );

  const filtered = invoices.filter((inv) => {
    const supplier = String(inv?.supplier ?? "").toLowerCase();
    const invoiceNumber = String(inv?.invoiceNumber ?? "").toLowerCase();
    const text = search.toLowerCase();
    return supplier.includes(text) || invoiceNumber.includes(text);
  });

  function handleAddProductRow() {
    if (!currentRow.productId || !currentRow.quantity || !currentRow.unitPrice || !currentRow.salePrice || !currentRow.expiryDate) {
      alert("Por favor completa los datos del producto (Producto, Cantidad, Costo, Precio de venta y Vencimiento)");
      return;
    }

    const quantity = Number(currentRow.quantity);
    const unitPrice = Number(currentRow.unitPrice);
    const salePrice = Number(currentRow.salePrice);
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      alert("Cantidad y costo unitario deben ser mayores a 0.");
      return;
    }
    if (!Number.isFinite(salePrice) || salePrice <= 0) {
      alert("El precio de venta debe ser mayor a 0.");
      return;
    }
    if (salePrice < unitPrice) {
      alert("El precio de venta no puede ser menor al costo.");
      return;
    }

    const prod = catalog.find((p) => String(p.id) === String(currentRow.productId));
    
    if (!prod) return;

    const exists = invoiceProds.some(p => String(p.productId) === String(prod.id));
    if (exists) {
        alert("Este producto ya está en la lista de la factura.");
        return;
    }

    setInvoiceProds((prev) => [
      ...prev,
      {
        productId:   prod.id,      // ID de la DB
        productCode: prod.code,    // Para mostrar en la tablita
        productName: prod.name,    // Para mostrar en la tablita
        quantity,
        unitPrice,
        salePrice,
        subtotal: quantity * unitPrice,
        expiryDate:  currentRow.expiryDate,
      },
    ]);

    setCurrentRow(EMPTY_PRODUCT_ROW_WITH_PRICE);
  }

  function handleRemoveProductRow(index) {
    setInvoiceProds((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(e) {
  e.preventDefault();
  if (invoiceProds.length === 0) {
    alert("Agrega al menos un producto a la factura!");
    return;
  }

  const totalValue = Number(productsTotal);
  if (!Number.isFinite(totalValue) || totalValue <= 0) {
    alert("Agrega productos con valor para calcular el total.");
    return;
  }

  if (!/^\d{14}$/.test(String(formData.rtn || ""))) {
    alert("El RTN debe contener exactamente 14 dígitos numéricos.");
    return;
  }

  setSaving(true);
  try {
    const selectedSupplier = suppliers.find((s) => String(s.id) === String(formData.supplier));
    const created = await createInvoice({
      ...formData,
      supplierName: selectedSupplier?.name || String(formData.supplier || ""),
      paymentMethod: formData.paymentMethod,
      products: invoiceProds,
      total: totalValue,
    });

    setInvoices((prev) => [created, ...prev]);

    const newSummary = await getPurchasesSummary();
    setSummary(newSummary);

    setShowModal(false);
    setFormData(EMPTY_FORM);
    setInvoiceProds([]);
    alert("Factura registrada y totales actualizados.");
    const nuevoResumen = await getPurchasesSummary();
    setSummary(nuevoResumen); 

  } catch (error) {
    console.error("Error al guardar:", error);
    alert("Hubo un error al procesar la compra.");
  } finally {
    setSaving(false);
  }
}

  function handleOpenModal() {
    setFormData({ ...EMPTY_FORM, supplier: suppliers[0]?.id ?? "" });
    setCurrentRow({ ...EMPTY_PRODUCT_ROW_WITH_PRICE, productId: catalog[0]?.id ?? "" });
    setInvoiceProds([]);
    setInvoiceImage(null);
    setShowSupplierForm(false);
    setShowProductForm(false);
    setNewProduct({ code: "", name: "", image: "" });
    setNewSupplier({ nombre: "", telefono: "" });
    setShowModal(true);
  }

  // ── Crear proveedor ───────────────────────────────────────────────────────
  async function handleCreateSupplier() {
    if (!newSupplier.nombre.trim()) return;
    
    setSavingSupplier(true);
    
    try {
        const created = await createSupplier(newSupplier.nombre, newSupplier.telefono);
        
        // --- BLOQUE DE ÉXITO ---
        // Recargar lista completa desde el backend
        const lista = await getSuppliers();
        setSuppliers(lista);
        
        // Seleccionar el proveedor recién creado en el formulario
        setFormData((prev) => ({ ...prev, supplier: created.id }));
        
        // Limpiar y cerrar modal
        setNewSupplier({ nombre: "", telefono: "" });
        setShowSupplierForm(false);
        
        alert("Proveedor creado con éxito"); // Mensaje opcional de éxito

    } catch (error) {
        // --- BLOQUE DE ERROR ---
        // Aquí capturamos el "El proveedor ya existe" que viene del backend
        alert(error.message); 
        
    } finally {
        // --- SE EJECUTA SIEMPRE AL FINAL ---
        setSavingSupplier(false);
    }
}

  async function handleCreateProduct() {
    if (!newProduct.name.trim() || !newProduct.code.trim()) {
      alert("Nombre y código del producto son obligatorios.");
      return;
    }

    setSavingProduct(true);
    try {
      const created = await createProductFromPurchases(
        newProduct.name.trim(),
        newProduct.code.trim(),
        newProduct.image.trim(),
      );

      const catalogo = await getAvailableProducts();
      setCatalog(catalogo);
      setCurrentRow((prev) => ({ ...prev, productId: created.id }));
      setNewProduct({ code: "", name: "", image: "" });
      setShowProductForm(false);
      alert("Producto creado y listo para agregar a la factura.");
    } catch (error) {
      alert(error?.message || "No se pudo crear el producto.");
    } finally {
      setSavingProduct(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Encabezado */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Compras</h1>
          <p className={styles.subtitle}>Registra y administra compras a proveedores</p>
        </div>
        <button className={styles.btnPrimary} onClick={handleOpenModal}>
          <Plus size={18} /> Nueva Factura
        </button>
      </div>

      {/* Búsqueda */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por proveedor o N° factura..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className={styles.summaryGrid}>
        {loading || !summary
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.summaryCard}>
                <Skeleton className={styles.skeletonLabel} />
                <Skeleton className={styles.skeletonValue} />
                <Skeleton className={styles.skeletonTrend} />
              </div>
            ))
          : (
            <>
              <div className={styles.summaryCard}>
                <p className={styles.summaryLabel}>Total Facturas (Mes)</p>
                <p className={styles.summaryValue}>L. {summary.totalMonth.toFixed(2)}</p>
                <p className={styles.summaryTrendGreen}>{summary.totalMonthPct} vs mes anterior</p>
              </div>
              <div className={styles.summaryCard}>
                <p className={styles.summaryLabel}>Facturas Registradas</p>
                <p className={styles.summaryValue}>{summary.invoiceCount}</p>
                <p className={styles.summaryTrendMuted}>Este mes</p>
              </div>
              <div className={styles.summaryCard}>
                <p className={styles.summaryLabel}>Productos Adquiridos</p>
                <p className={styles.summaryValue}>{summary.unitsBought.toLocaleString()}</p>
                <p className={styles.summaryTrendMuted}>Unidades</p>
              </div>
            </>
          )}
      </div>

      {/* Tabla historial */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>Historial de Facturas</h3>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Proveedor</th>
                <th>RTN</th>
                <th>Fecha</th>
                <th>Productos</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j}><Skeleton className={styles.skeletonText} /></td>
                      ))}
                    </tr>
                  ))
                : filtered.length === 0
                ? (
                    <tr>
                      <td colSpan={6} className={styles.emptyRow}>No se encontraron facturas</td>
                    </tr>
                  )
                : filtered.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <button className={styles.invoiceLink} onClick={() => setSelectedInvoice(inv)}>
                          <Eye size={15} /> {inv.invoiceNumber}
                        </button>
                      </td>
                      <td className={styles.supplierName}>{inv.supplier}</td>
                      <td className={styles.muted}>{inv.rtn}</td>
                      <td className={styles.muted}>{inv.invoiceDate}</td>
                      <td className={styles.muted}>{inv.products.length} producto(s)</td>
                      <td className={styles.totalCell}>L. {Number(inv.total).toFixed(2)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal detalle ── */}
      {selectedInvoice && (
        <div className={styles.modalOverlay} onClick={() => setSelectedInvoice(null)}>
          <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <FileText size={20} color="#2563eb" />
                <h2 className={styles.modalTitle}>Factura — {selectedInvoice.invoiceNumber}</h2>
              </div>
              <button className={styles.modalClose} onClick={() => setSelectedInvoice(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.detailBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailField}>
                  <span className={styles.detailLabel}>Proveedor</span>
                  <span className={styles.detailValue}>{selectedInvoice.supplier}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.detailLabel}>RTN</span>
                  <span className={styles.detailValue}>{selectedInvoice.rtn}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.detailLabel}>Fecha de Factura</span>
                  <span className={styles.detailValue}>{selectedInvoice.invoiceDate}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.detailLabel}>Total</span>
                  <span className={styles.detailValueBlue}>L. {Number(selectedInvoice.total).toFixed(2)}</span>
                </div>
              </div>
              {selectedInvoice.imageUrl && (
                <div className={styles.invoiceImageWrap}>
                  <h4 className={styles.detailSectionTitle}>Imagen de la Factura</h4>
                  <img src={selectedInvoice.imageUrl} alt="Factura" className={styles.invoiceImage} />
                </div>
              )}
              <div>
                <h4 className={styles.detailSectionTitle}>Productos</h4>
                <div className={styles.detailTableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID Producto</th>
                        <th>Nombre</th>
                        <th>Cantidad</th>
                        <th>Fecha de Vencimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.products.map((p, i) => (
                        <tr key={i}>
                          <td className={styles.muted}>{p.productId}</td>
                          <td className={styles.supplierName}>{p.productName}</td>
                          <td className={styles.muted}>{p.quantity}</td>
                          <td className={styles.muted}>{p.expiryDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={styles.detailFooter}>
                <button className={styles.btnOutline} onClick={() => setSelectedInvoice(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal nueva factura ── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Registrar Factura</h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className={styles.modalForm}>
              <section className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Datos de la Factura</h3>
                <div className={styles.formGrid}>

                  <div className={styles.formGroup}>
                    <label>Número de Factura</label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      placeholder="FAC-2024-001"
                      required
                    />
                  </div>

                  {/* Proveedor con botón + */}
                  <div className={styles.formGroup}>
                    <label>Proveedor</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        style={{ flex: 1 }}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={styles.btnAddRow}
                        onClick={() => setShowSupplierForm((v) => !v)}
                        title="Agregar nuevo proveedor"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Mini formulario inline */}
                    {showSupplierForm && (
                      <div style={{
                        marginTop: "10px",
                        padding: "12px",
                        background: "#f9fafb",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                      }}>
                        <input
                          type="text"
                          placeholder="Nombre del proveedor *"
                          value={newSupplier.nombre}
                          onChange={(e) => setNewSupplier({ ...newSupplier, nombre: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Teléfono (opcional)"
                          value={newSupplier.telefono}
                          onChange={(e) => setNewSupplier({ ...newSupplier, telefono: e.target.value })}
                        />
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className={styles.btnOutline}
                            onClick={() => setShowSupplierForm(false)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className={styles.btnPrimary}
                            onClick={handleCreateSupplier}
                            disabled={savingSupplier || !newSupplier.nombre.trim()}
                          >
                            {savingSupplier ? "Guardando..." : "Guardar proveedor"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>RTN</label>
                    <input
                      type="text"
                      value={formData.rtn}
                      onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 14);
                        setFormData({ ...formData, rtn: onlyDigits });
                      }}
                      inputMode="numeric"
                      maxLength={14}
                      pattern="\d{14}"
                      placeholder="08019990123456"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Fecha de Factura</label>
                    <input
                      type="date"
                      value={formData.invoiceDate}
                      onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Método de pago</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      required
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta">Tarjeta</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Total de Factura (calculado)</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={productsTotal.toFixed(2)}
                      placeholder="0.00"
                      readOnly
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Imagen */}
              <section className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Imagen de la Factura</h3>
                <label className={styles.uploadArea}>
                  <Upload size={20} color="#6b7280" />
                  <span>{invoiceImage ? invoiceImage.name : "Haz clic para subir imagen"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setInvoiceImage(e.target.files?.[0] ?? null)}
                    className={styles.hiddenInput}
                  />
                </label>
                {invoiceImage && (
                  <button type="button" className={styles.clearImage} onClick={() => setInvoiceImage(null)}>
                    <X size={14} /> Quitar imagen
                  </button>
                )}
              </section>

              {/* Productos */}
              <section className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Productos</h3>
                <div className={styles.productRowGrid}>
                  <div className={styles.formGroup}>
                    <label>Producto</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select
                        value={currentRow.productId}
                        onChange={(e) => setCurrentRow({ ...currentRow, productId: e.target.value })}
                        style={{ flex: 1 }}
                      >
                        <option value="">Seleccionar producto...</option>
                        {catalog.map((p) => (
                          <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={styles.btnAddRow}
                        onClick={() => setShowProductForm((v) => !v)}
                        title="Agregar nuevo producto"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {showProductForm && (
                      <div style={{
                        marginTop: "10px",
                        padding: "12px",
                        background: "#f9fafb",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                      }}>
                        <input
                          type="text"
                          placeholder="Código del producto *"
                          value={newProduct.code}
                          onChange={(e) => setNewProduct((prev) => ({ ...prev, code: e.target.value }))}
                        />
                        <input
                          type="text"
                          placeholder="Nombre del producto *"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                        />
                        <input
                          type="text"
                          placeholder="URL imagen (opcional)"
                          value={newProduct.image}
                          onChange={(e) => setNewProduct((prev) => ({ ...prev, image: e.target.value }))}
                        />
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className={styles.btnOutline}
                            onClick={() => setShowProductForm(false)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className={styles.btnPrimary}
                            onClick={handleCreateProduct}
                            disabled={savingProduct || !newProduct.name.trim() || !newProduct.code.trim()}
                          >
                            {savingProduct ? "Guardando..." : "Guardar producto"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label>Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={currentRow.quantity}
                      onChange={(e) => setCurrentRow({ ...currentRow, quantity: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Valor unitario</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={currentRow.unitPrice || ""}
                      onChange={(e) => setCurrentRow({ ...currentRow, unitPrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Precio de venta</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={currentRow.salePrice || ""}
                      onChange={(e) => setCurrentRow({ ...currentRow, salePrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Vencimiento</label>
                    <input
                      type="date"
                      value={currentRow.expiryDate}
                      onChange={(e) => setCurrentRow({ ...currentRow, expiryDate: e.target.value })}
                    />
                  </div>
                  <div className={styles.addRowBtnWrap}>
                    <button type="button" className={styles.btnAddRow} onClick={handleAddProductRow}>
                      <Plus size={16} /> Agregar
                    </button>
                  </div>
                </div>

                {invoiceProds.length > 0 && (
                  <div className={styles.detailTableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Nombre</th>
                          <th>Cantidad</th>
                          <th>Costo</th>
                          <th>Precio venta</th>
                          <th>Subtotal</th>
                          <th>Vencimiento</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceProds.map((p, i) => (
                          <tr key={i}>
                            <td className={styles.muted}>{p.productId}</td>
                            <td className={styles.supplierName}>{p.productName}</td>
                            <td className={styles.muted}>{p.quantity}</td>
                            <td className={styles.muted}>L. {Number(p.unitPrice || 0).toFixed(2)}</td>
                            <td className={styles.muted}>L. {Number(p.salePrice || 0).toFixed(2)}</td>
                            <td className={styles.muted}>L. {Number(p.subtotal || 0).toFixed(2)}</td>
                            <td className={styles.muted}>{p.expiryDate}</td>
                            <td>
                              <button
                                type="button"
                                className={styles.btnDeleteRow}
                                onClick={() => handleRemoveProductRow(i)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  {saving ? "Registrando..." : "Registrar Factura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}