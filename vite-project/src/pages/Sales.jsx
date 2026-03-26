import { useState, useEffect } from "react";
import { Search, Plus, Trash2, ShoppingCart, History } from "lucide-react";
import {
  getSaleProducts,
  getPaymentMethods,
  createSale,
  calculateTotals,
} from "../services/salesService";
import styles from "../styles/Sales.module.css";

const API_URL = "http://localhost:3008/api";

function Skeleton({ className }) {
  return <div className={`${styles.skeleton} ${className ?? ""}`} />;
}

export default function Sales() {
  const [products,       setProducts]       = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  const [search,        setSearch]        = useState("");
  const [cart,          setCart]          = useState([]);
  const [client,        setClient]        = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [finalizing,    setFinalizing]    = useState(false);
  const [saleError,     setSaleError]     = useState(null);
  const [lastSale,      setLastSale]      = useState(null);

  // ── Historial ──────────────────────────────────────────────────────────────
  const [showHistory, setShowHistory] = useState(false);
  const [historyDate, setHistoryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoad, setHistoryLoad] = useState(false);

  // ── Detalle de venta ───────────────────────────────────────────────────────
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [detailLoad,    setDetailLoad]    = useState(false);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getSaleProducts(), getPaymentMethods()])
      .then(([prods, methods]) => {
        setProducts(prods);
        setPaymentMethods(methods);
        setPaymentMethod(methods[0] ?? "");
      })
      .catch(() => setError("Error cargando los datos. Intenta de nuevo."))
      .finally(() => setLoading(false));
  }, []);

  // ── Historial por fecha ─────────────────────────────────────────────────
  async function fetchHistory(fecha) {
    setHistoryLoad(true);
    try {
      const res  = await fetch(`${API_URL}/ventas?fecha=${fecha}`);
      const json = await res.json();
      setHistoryData(json.status === 200 ? json.data : []);
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoad(false);
    }
  }

  // ── Detalle de venta ───────────────────────────────────────────────────────
  async function fetchVentaDetalle(id) {
    setDetailLoad(true);
    try {
      const res  = await fetch(`${API_URL}/ventas/${id}`);
      const json = await res.json();
      setSelectedVenta(json);
    } catch {
      setSelectedVenta(null);
    } finally {
      setDetailLoad(false);
    }
  }

  // ── Filtrado de productos ──────────────────────────────────────────────────
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  // ── Carrito ────────────────────────────────────────────────────────────────
  function addToCart(product) {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) {
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
            : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }

  function updateQuantity(id, qty) {
    const normalizedQty = Number(qty);
    if (!Number.isFinite(normalizedQty)) return;
    if (normalizedQty <= 0) { removeFromCart(id); return; }
    setCart((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, quantity: Math.max(1, Math.min(Math.floor(normalizedQty), i.stock)) }
          : i
      )
    );
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  function clearCart() {
    setCart([]);
    setClient("");
    setPaymentMethod(paymentMethods[0] ?? "");
    setSaleError(null);
  }

  // ── Totales ────────────────────────────────────────────────────────────────
  const { subtotal, total } = calculateTotals(cart);

  // ── Finalizar venta ────────────────────────────────────────────────────────
  async function handleFinalize() {
    if (cart.length === 0) return;
    setSaleError(null);
    setFinalizing(true);
    try {
      const sale = await createSale({
        client,
        paymentMethod,
        items: cart.map((i) => ({
          id:       i.id,
          code:     i.code,
          price:    i.price,
          quantity: i.quantity,
        })),
      });
      setLastSale(sale);
      clearCart();
      const updatedProducts = await getSaleProducts();
      setProducts(updatedProducts);
    } catch (err) {
      setSaleError(err.message);
    } finally {
      setFinalizing(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Encabezado */}
      <div className={styles.pageHeader}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Punto de Venta (POS)</h1>
            <p className={styles.subtitle}>Registra nuevas ventas</p>
          </div>
          <button
            className={styles.btnHistory}
            onClick={() => { setShowHistory(true); fetchHistory(historyDate); }}
          >
            <History size={16} />
            Historial de Ventas
          </button>
        </div>
      </div>

      {/* Error de carga inicial */}
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠ {error}</span>
          <button className={styles.bannerClose} onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Confirmación de última venta */}
      {lastSale && (
        <div className={styles.successBanner}>
          <span>
            ✓ Venta <strong>{lastSale.saleNumber}</strong> registrada por{" "}
            <strong>L. {Number(lastSale.total).toFixed(2)}</strong>
          </span>
          <button className={styles.bannerClose} onClick={() => setLastSale(null)}>✕</button>
        </div>
      )}

      <div className={styles.posGrid}>

        {/* ── Columna izquierda: productos ── */}
        <div className={styles.productsColumn}>

          {/* Búsqueda */}
          <div className={styles.searchCard}>
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

          {/* Grid de productos */}
          <div className={styles.productsCard}>
            <h3 className={styles.cardTitle}>Productos Disponibles</h3>
            <div className={styles.productsGrid}>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={styles.productCardSkeleton}>
                      <Skeleton className={styles.skeletonName} />
                      <Skeleton className={styles.skeletonPrice} />
                      <Skeleton className={styles.skeletonStock} />
                    </div>
                  ))
                : filtered.length === 0
                ? <p className={styles.emptyProducts}>No se encontraron productos</p>
                : filtered.map((p) => (
                    <div
                      key={p.id}
                      className={`${styles.productCard} ${p.stock === 0 ? styles.outOfStock : ""}`}
                      onClick={() => p.stock > 0 && addToCart(p)}
                    >
                      <div className={styles.productCardTop}>
                        <h4 className={styles.productCardName}>{p.name}</h4>
                        <Plus size={18} color="#2563eb" />
                      </div>
                      <p className={styles.productCardCode}>{p.code}</p>
                      <p className={styles.productCardPrice}>L. {p.price.toFixed(2)}</p>
                      <p className={styles.productCardStock}>
                        Stock: {p.stock} {p.stock === 0 ? "— Agotado" : "unidades"}
                      </p>
                    </div>
                  ))}
            </div>
          </div>
        </div>

        {/* ── Columna derecha: carrito ── */}
        <div className={styles.cartColumn}>

          {/* Cliente */}
          <div className={styles.sideCard}>
            <label className={styles.sideLabel}>
              Cliente {paymentMethod === "credito" && <span className={styles.required}>*obligatorio</span>}
            </label>
            <input
              type="text"
              placeholder={
                paymentMethod === "credito"
                  ? "ID del cliente (requerido para crédito)"
                  : "Nombre del cliente (opcional)"
              }
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className={styles.sideInput}
            />
          </div>

          {/* Método de pago */}
          <div className={styles.sideCard}>
            <label className={styles.sideLabel}>Método de Pago</label>
            {loading
              ? <Skeleton className={styles.skeletonInput} />
              : (
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={styles.sideSelect}
                >
                  {paymentMethods.map((m) => (
                    <option key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </option>
                  ))}
                </select>
              )}
          </div>

          {/* Carrito */}
          <div className={styles.cartCard}>
            <div className={styles.cartHeader}>
              <div className={styles.cartHeaderLeft}>
                <ShoppingCart size={18} color="#2563eb" />
                <h3 className={styles.cardTitle}>Carrito</h3>
              </div>
              <span className={styles.cartCount}>{cart.length}</span>
            </div>

            <div className={styles.cartItems}>
              {cart.length === 0
                ? <p className={styles.cartEmpty}>El carrito está vacío</p>
                : cart.map((item) => (
                    <div key={item.id} className={styles.cartItem}>
                      <div className={styles.cartItemInfo}>
                        <p className={styles.cartItemName}>{item.name}</p>
                        <p className={styles.cartItemPrice}>L. {item.price.toFixed(2)}</p>
                      </div>
                      <div className={styles.cartItemControls}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >−</button>
                        <input
                          type="number"
                          min="1"
                          max={item.stock}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, e.target.value)}
                          className={styles.qtyInput}
                        />
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >+</button>
                        <span className={styles.cartItemSubtotal}>
                          L. {(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
            </div>

            {/* Totales */}
            {cart.length > 0 && (
              <div className={styles.totals}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>L. {subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.totalRowFinal}>
                  <span>Total</span>
                  <span>L. {total.toFixed(2)}</span>
                </div>

                {saleError && (
                  <div className={styles.saleError}>
                    ⚠ {saleError}
                  </div>
                )}

                <button
                  className={styles.btnFinalize}
                  onClick={handleFinalize}
                  disabled={finalizing || (paymentMethod === "credito" && !client)}
                >
                  {finalizing ? "Procesando..." : "Finalizar Venta"}
                </button>

                {paymentMethod === "credito" && !client && (
                  <p className={styles.creditWarning}>
                    Ingresa el ID del cliente para ventas a crédito
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal historial ── */}
      {showHistory && (
        <div className={styles.modalOverlay} onClick={() => setShowHistory(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>

            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Historial de Ventas</h2>
              <button className={styles.modalClose} onClick={() => setShowHistory(false)}>✕</button>
            </div>

            <div className={styles.modalFilter}>
              <input
                type="date"
                value={historyDate}
                onChange={(e) => { setHistoryDate(e.target.value); fetchHistory(e.target.value); }}
                className={styles.sideInput}
              />
            </div>

            <div className={styles.modalBody}>
              {historyLoad ? (
                <p className={styles.modalMsg}>Cargando...</p>
              ) : historyData.length === 0 ? (
                <p className={styles.modalMsg}>No hay ventas para esta fecha</p>
              ) : (
                historyData.map((v) => (
                  <div key={v.id} className={styles.historyItem}>
                    <div className={styles.historyLeft}>
                      <span className={styles.historyNum}>
                        {v.Factura?.num_factura ?? `#${v.id}`}
                      </span>
                      <span className={styles.historyMethod}>{v.metodo_pago}</span>
                    </div>
                    <div className={styles.historyRight}>
                      <span className={styles.historyTotal}>
                        L. {Number(v.total).toFixed(2)}
                      </span>
                      <span className={styles.historyDate}>
                        {new Date(v.fecha).toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <button
                      className={styles.btnVerDetalle}
                      onClick={() => fetchVentaDetalle(v.id)}
                    >
                      Ver
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Modal detalle de venta ── */}
      {(selectedVenta || detailLoad) && (
        <div className={styles.modalOverlay} onClick={() => setSelectedVenta(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>

            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {detailLoad ? "Cargando..." : selectedVenta?.Factura?.num_factura ?? `Venta #${selectedVenta?.id}`}
              </h2>
              <button className={styles.modalClose} onClick={() => setSelectedVenta(null)}>✕</button>
            </div>

            {detailLoad ? (
              <div className={styles.modalBody}>
                <p className={styles.modalMsg}>Cargando detalle...</p>
              </div>
            ) : (
              <>
                <div className={styles.detailMeta}>
                  <div className={styles.detailMetaRow}>
                    <span className={styles.detailMetaLabel}>Fecha</span>
                    <span>{new Date(selectedVenta.fecha).toLocaleString("es-HN")}</span>
                  </div>
                  <div className={styles.detailMetaRow}>
                    <span className={styles.detailMetaLabel}>Método de pago</span>
                    <span style={{ textTransform: "capitalize" }}>{selectedVenta.metodo_pago}</span>
                  </div>
                  {selectedVenta.id_cliente && (
                    <div className={styles.detailMetaRow}>
                      <span className={styles.detailMetaLabel}>Cliente</span>
                      <span>#{selectedVenta.id_cliente}</span>
                    </div>
                  )}
                </div>

                <div className={styles.modalBody}>
                  {selectedVenta.Factura?.DetalleFacturas?.map((d, i) => (
                    <div key={i} className={styles.detailItem}>
                      <div className={styles.detailItemLeft}>
                        <span className={styles.detailItemName}>
                          {d.Inventario?.Producto?.nombre}
                        </span>
                        <span className={styles.detailItemCode}>
                          {d.Inventario?.Producto?.codigo}
                        </span>
                      </div>
                      <div className={styles.detailItemRight}>
                        <span className={styles.detailItemQty}>x{d.cantidad}</span>
                        <span className={styles.detailItemSubtotal}>
                          L. {Number(d.subtotal).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.detailFooter}>
                  <span className={styles.detailTotalLabel}>Total</span>
                  <span className={styles.detailTotalValue}>
                    L. {Number(selectedVenta.total).toFixed(2)}
                  </span>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}