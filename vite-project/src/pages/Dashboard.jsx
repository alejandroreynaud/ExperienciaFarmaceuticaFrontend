import { useState, useEffect } from "react";
import {
  DollarSign, Package, AlertTriangle,
  Archive, ShoppingCart, Users, X,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getDashboardStats,
  getDailyAnalysis,
  getWeeklySales,
  getMonthlyRevenue,
  getNotifications,
  getLowStockProducts,
  getExpiringDetail,
  getLowStockDetail,
} from "../services/dashboardService";
import styles from "../styles/Dashboard.module.css";

// ── Mapas de iconos ───────────────────────────────────────────────────────────
const STAT_ICONS = {
  ventas_dia:       DollarSign,
  bajo_stock:       AlertTriangle,
  proximos_vencer:  Package,
  total_inventario: Archive,
};

const NOTIF_ICONS = {
  warning: { Icon: AlertTriangle, colorClass: styles.notifWarning },
  danger:  { Icon: Package,       colorClass: styles.notifDanger  },
  success: { Icon: ShoppingCart,  colorClass: styles.notifSuccess },
  info:    { Icon: Users,         colorClass: styles.notifInfo    },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return <div className={`${styles.skeleton} ${className ?? ""}`} />;
}

// ── Modal de detalle: Stock Bajo ──────────────────────────────────────────────
function LowStockModal({ onClose }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLowStockDetail()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={`${styles.modalHeaderIcon} ${styles.iconOrangeBg}`}>
              <AlertTriangle size={18} color="#f97316" />
            </div>
            <h2 className={styles.modalTitle}>Productos con Stock Bajo</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalSubtitle}>
            Productos que están por debajo del stock mínimo requerido.
          </p>

          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.detailRow}>
                  <Skeleton className={styles.skeletonDetailName} />
                  <Skeleton className={styles.skeletonDetailBar} />
                </div>
              ))
            : items.map((item, i) => {
                const pct = Math.round((item.stock / item.min) * 100);
                return (
                  <div key={i} className={styles.detailRow}>
                    <div className={styles.detailRowTop}>
                      <span className={styles.detailName}>{item.name}</span>
                      <span className={styles.detailBadgeOrange}>
                        {item.stock} / {item.min} unidades
                      </span>
                    </div>
                    <div className={styles.detailProgress}>
                      <div
                        className={styles.detailProgressFill}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <p className={styles.detailHint}>
                      {pct}% del mínimo requerido — faltan {item.min - item.stock} unidades
                    </p>
                  </div>
                );
              })}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnOutline} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de detalle: Próximos a Vencer ───────────────────────────────────────
function ExpiringModal({ onClose }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExpiringDetail()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  function urgencyClass(days) {
    if (days <= 10) return styles.detailBadgeRed;
    if (days <= 20) return styles.detailBadgeOrange;
    return styles.detailBadgeYellow;
  }

  function urgencyLabel(days) {
    if (days <= 10) return "Crítico";
    if (days <= 20) return "Urgente";
    return "Próximo";
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={`${styles.modalHeaderIcon} ${styles.iconRedBg}`}>
              <Package size={18} color="#ef4444" />
            </div>
            <h2 className={styles.modalTitle}>Próximos a Vencer</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalSubtitle}>
            Productos que vencen en los próximos 30 días.
          </p>

          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.detailRow}>
                  <Skeleton className={styles.skeletonDetailName} />
                  <Skeleton className={styles.skeletonDetailSub} />
                </div>
              ))
            : items.map((item, i) => (
                <div key={i} className={styles.detailRow}>
                  <div className={styles.detailRowTop}>
                    <span className={styles.detailName}>{item.name}</span>
                    <span className={urgencyClass(item.daysLeft)}>
                      {urgencyLabel(item.daysLeft)}
                    </span>
                  </div>
                  <div className={styles.detailMeta}>
                    <span className={styles.detailMetaItem}>
                      Vence: <strong>{item.expiryDate}</strong>
                    </span>
                    <span className={styles.detailMetaItem}>
                      Quedan: <strong>{item.daysLeft} días</strong>
                    </span>
                    <span className={styles.detailMetaItem}>
                      Cantidad: <strong>{item.quantity} uds.</strong>
                    </span>
                  </div>
                </div>
              ))}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnOutline} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats,         setStats]         = useState([]);
  const [daily,         setDaily]         = useState(null);
  const [weeklySales,   setWeeklySales]   = useState([]);
  const [monthlyRev,    setMonthlyRev]    = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [lowStock,      setLowStock]      = useState([]);

  const [loading, setLoading] = useState({
    stats: true, daily: true, charts: true, notifications: true, lowStock: true,
  });

  // Modal activo: "low_stock" | "expiring" | null
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .finally(() => setLoading((p) => ({ ...p, stats: false })));

    getDailyAnalysis()
      .then(setDaily)
      .finally(() => setLoading((p) => ({ ...p, daily: false })));

    Promise.all([getWeeklySales(), getMonthlyRevenue()])
      .then(([w, m]) => { setWeeklySales(w); setMonthlyRev(m); })
      .finally(() => setLoading((p) => ({ ...p, charts: false })));

    getNotifications()
      .then(setNotifications)
      .finally(() => setLoading((p) => ({ ...p, notifications: false })));

    getLowStockProducts()
      .then(setLowStock)
      .finally(() => setLoading((p) => ({ ...p, lowStock: false })));
  }, []);

  function handleNotifClick(notif) {
    if (notif.detailType) setActiveModal(notif.detailType);
  }

  return (
    <div className={styles.page}>

      {/* Encabezado */}
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Bienvenido al panel de control</p>
      </div>

      {/* Tarjetas de stats */}
      <div className={styles.statsGrid}>
        {loading.stats
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.statCard}>
                <div className={styles.statContent}>
                  <Skeleton className={styles.skeletonLabel} />
                  <Skeleton className={styles.skeletonValue} />
                  <Skeleton className={styles.skeletonTrend} />
                </div>
                <Skeleton className={styles.skeletonIcon} />
              </div>
            ))
          : stats.map((card) => {
              const Icon = STAT_ICONS[card.id] ?? Package;
              return (
                <div key={card.id} className={styles.statCard}>
                  <div className={styles.statContent}>
                    <p className={styles.statLabel}>{card.title}</p>
                    <p className={styles.statValue}>{card.value}</p>
                    <p className={styles.statTrend}>{card.trend}</p>
                  </div>
                  <div className={`${styles.statIcon} ${styles[`icon_${card.color}`]}`}>
                    <Icon size={24} color="#fff" />
                  </div>
                </div>
              );
            })}
      </div>

      {/* Analisis diario */}
      <div className={styles.card}>
        <div className={styles.dailyHeader}>
          <h3 className={styles.cardTitle}>Analisis Diario</h3>
          {!loading.daily && daily?.fecha && (
            <span className={styles.dailyDate}>{daily.fecha}</span>
          )}
        </div>

        {loading.daily
          ? (
            <div className={styles.dailyGrid}>
              <Skeleton className={styles.skeletonDailyCard} />
              <Skeleton className={styles.skeletonDailyCard} />
              <Skeleton className={styles.skeletonDailyCard} />
            </div>
          )
          : (
            <div className={styles.dailyGrid}>
              <div className={styles.dailyItem}>
                <p className={styles.dailyLabel}>Total vendido hoy</p>
                <p className={styles.dailyValue}>{daily?.total ?? "L. 0.00"}</p>
              </div>
              <div className={styles.dailyItem}>
                <p className={styles.dailyLabel}>Numero de ventas</p>
                <p className={styles.dailyValue}>{daily?.sales ?? 0}</p>
              </div>
              <div className={styles.dailyItem}>
                <p className={styles.dailyLabel}>Ticket promedio</p>
                <p className={styles.dailyValue}>{daily?.ticketPromedio ?? "L. 0.00"}</p>
              </div>
            </div>
          )}
      </div>

      {/* Gráficas */}
      <div className={styles.chartsGrid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Ventas Semanales</h3>
          {loading.charts
            ? <Skeleton className={styles.skeletonChart} />
            : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="ventas" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Ingresos Mensuales</h3>
          {loading.charts
            ? <Skeleton className={styles.skeletonChart} />
            : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyRev}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
        </div>
      </div>

      {/* Fila inferior */}
      <div className={styles.bottomGrid}>

        {/* Stock bajo */}
        <div className={`${styles.card} ${styles.cardWide}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Productos con Bajo Stock</h3>
          </div>
          <div className={styles.cardBody}>
            {loading.lowStock
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={styles.stockRow}>
                    <div className={styles.stockInfo}>
                      <Skeleton className={styles.skeletonLabel} />
                      <Skeleton className={styles.skeletonBar} />
                    </div>
                    <Skeleton className={styles.skeletonTrend} />
                  </div>
                ))
              : lowStock.map((p, i) => (
                  <div key={i} className={styles.stockRow}>
                    <div className={styles.stockInfo}>
                      <p className={styles.stockName}>{p.name}</p>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${(p.stock / p.min) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className={styles.stockNumbers}>
                      {p.stock} / {p.min}
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Notificaciones */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Notificaciones</h3>
          </div>
          <div className={styles.notifList}>
            {loading.notifications
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={styles.notifItem}>
                    <Skeleton className={styles.skeletonNotifIcon} />
                    <div className={styles.notifText}>
                      <Skeleton className={styles.skeletonLabel} />
                      <Skeleton className={styles.skeletonTrend} />
                    </div>
                  </div>
                ))
              : notifications.map((notif) => {
                  const { Icon, colorClass } = NOTIF_ICONS[notif.type] ?? NOTIF_ICONS.info;
                  const hasDetail = !!notif.detailType;
                  return (
                    <div
                      key={notif.id}
                      className={`${styles.notifItem} ${hasDetail ? styles.notifClickable : ""}`}
                      onClick={() => handleNotifClick(notif)}
                      title={hasDetail ? "Ver detalle" : undefined}
                    >
                      <div className={`${styles.notifIconWrap} ${colorClass}`}>
                        <Icon size={16} />
                      </div>
                      <div className={styles.notifText}>
                        <div className={styles.notifTitleRow}>
                          <p className={styles.notifTitle}>{notif.title}</p>
                          {hasDetail && (
                            <span className={styles.notifDetailHint}>Ver detalle →</span>
                          )}
                        </div>
                        <p className={styles.notifMessage}>{notif.message}</p>
                        <p className={styles.notifTime}>{notif.time}</p>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

      </div>

      {/* ── Modales de detalle ── */}
      {activeModal === "low_stock" && (
        <LowStockModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "expiring" && (
        <ExpiringModal onClose={() => setActiveModal(null)} />
      )}

    </div>
  );
}
