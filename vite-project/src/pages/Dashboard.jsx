import { useState, useEffect } from "react";
import {
  DollarSign,
  Package,
  AlertTriangle,
  Archive,
  ShoppingCart,
  Users,
} from "lucide-react";
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  getDashboardStats,
  getWeeklySales,
  getMonthlyRevenue,
  getNotifications,
  getLowStockProducts,
} from "../services/dashboardService";

import styles from "../styles/Dashboard.module.css";

// ── Mapa de iconos por id de stat ────────────────────────────────────────────
const STAT_ICONS = {
  ventas_dia:       DollarSign,
  bajo_stock:       AlertTriangle,
  proximos_vencer:  Package,
  total_inventario: Archive,
};

// ── Mapa de iconos por tipo de notificación ──────────────────────────────────
const NOTIF_ICONS = {
  warning: { Icon: AlertTriangle, colorClass: styles.notifWarning },
  danger:  { Icon: Package,       colorClass: styles.notifDanger  },
  success: { Icon: ShoppingCart,  colorClass: styles.notifSuccess },
  info:    { Icon: Users,         colorClass: styles.notifInfo    },
};

// ── Skeleton genérico ────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return <div className={`${styles.skeleton} ${className ?? ""}`} />;
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats,         setStats]         = useState([]);
  const [weeklySales,   setWeeklySales]   = useState([]);
  const [monthlyRev,    setMonthlyRev]    = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [lowStock,      setLowStock]      = useState([]);

  // Estado de carga por sección — cada una es independiente
  const [loading, setLoading] = useState({
    stats:         true,
    charts:        true,
    notifications: true,
    lowStock:      true,
  });

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .finally(() => setLoading((prev) => ({ ...prev, stats: false })));

    Promise.all([getWeeklySales(), getMonthlyRevenue()])
      .then(([weekly, monthly]) => {
        setWeeklySales(weekly);
        setMonthlyRev(monthly);
      })
      .finally(() => setLoading((prev) => ({ ...prev, charts: false })));

    getNotifications()
      .then(setNotifications)
      .finally(() => setLoading((prev) => ({ ...prev, notifications: false })));

    getLowStockProducts()
      .then(setLowStock)
      .finally(() => setLoading((prev) => ({ ...prev, lowStock: false })));
  }, []);

  return (
    <div className={styles.page}>

      {/* Encabezado */}
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Bienvenido al panel de control</p>
      </div>

      {/* ── Tarjetas de stats ── */}
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

      {/* ── Gráficas ── */}
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
                  <Line
                    type="monotone"
                    dataKey="ingresos"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
        </div>
      </div>

      {/* ── Fila inferior ── */}
      <div className={styles.bottomGrid}>

        {/* Productos con bajo stock */}
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
              : lowStock.map((product, i) => (
                  <div key={i} className={styles.stockRow}>
                    <div className={styles.stockInfo}>
                      <p className={styles.stockName}>{product.name}</p>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${(product.stock / product.min) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className={styles.stockNumbers}>
                      {product.stock} / {product.min}
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
                  return (
                    <div key={notif.id} className={styles.notifItem}>
                      <div className={`${styles.notifIconWrap} ${colorClass}`}>
                        <Icon size={16} />
                      </div>
                      <div className={styles.notifText}>
                        <p className={styles.notifTitle}>{notif.title}</p>
                        <p className={styles.notifMessage}>{notif.message}</p>
                        <p className={styles.notifTime}>{notif.time}</p>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

      </div>
    </div>
  );
}
