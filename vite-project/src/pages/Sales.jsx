import { useState, useEffect } from "react";
import { Search, Plus, Trash2, ShoppingCart } from "lucide-react";
import {
  getSaleProducts,
  getPaymentMethods,
  createSale,
  calculateTotals,
} from "../services/salesService";
import styles from "../styles/Sales.module.css";

function Skeleton({ className }) {
  return <div className={`${styles.skeleton} ${className ?? ""}`} />;
}

export default function Sales() {
  const [products,       setProducts]       = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading,        setLoading]        = useState(true);

  const [search,        setSearch]        = useState("");
  const [cart,          setCart]          = useState([]);
  const [client,        setClient]        = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [finalizing,    setFinalizing]    = useState(false);
  const [lastSale,      setLastSale]      = useState(null);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getSaleProducts(), getPaymentMethods()])
      .then(([prods, methods]) => {
        setProducts(prods);
        setPaymentMethods(methods);
        setPaymentMethod(methods[0] ?? "");
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Filtrado de productos ──────────────────────────────────────────────────
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
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
    if (qty <= 0) { removeFromCart(id); return; }
    setCart((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.min(qty, i.stock) } : i
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
  }

  // ── Totales ────────────────────────────────────────────────────────────────
  const { subtotal, tax, total } = calculateTotals(cart);

  // ── Finalizar venta ────────────────────────────────────────────────────────
  async function handleFinalize() {
    if (cart.length === 0) return;
    setFinalizing(true);
    try {
      const sale = await createSale({
        client,
        paymentMethod,
        items: cart.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        subtotal,
        tax,
        total,
      });
      setLastSale(sale);
      clearCart();
    } finally {
      setFinalizing(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Encabezado */}
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Punto de Venta (POS)</h1>
        <p className={styles.subtitle}>Registra nuevas ventas</p>
      </div>

      {/* Confirmación de última venta */}
      {lastSale && (
        <div className={styles.successBanner}>
          <span>✓ Venta <strong>{lastSale.saleNumber}</strong> registrada por <strong>L. {Number(lastSale.total).toFixed(2)}</strong></span>
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
                placeholder="Buscar productos..."
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
            <label className={styles.sideLabel}>Cliente</label>
            <input
              type="text"
              placeholder="Nombre del cliente (opcional)"
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
                    <option key={m} value={m}>{m}</option>
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
                        <span className={styles.qtyValue}>{item.quantity}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >+</button>
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
                <div className={styles.totalRow}>
                  <span>ISV (15%)</span>
                  <span>L. {tax.toFixed(2)}</span>
                </div>
                <div className={styles.totalRowFinal}>
                  <span>Total</span>
                  <span>L. {total.toFixed(2)}</span>
                </div>
                <button
                  className={styles.btnFinalize}
                  onClick={handleFinalize}
                  disabled={finalizing}
                >
                  {finalizing ? "Procesando..." : "Finalizar Venta"}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
