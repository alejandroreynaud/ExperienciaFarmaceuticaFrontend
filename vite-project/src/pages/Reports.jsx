import { useState, useEffect, useCallback } from "react";
import { FileDown, DollarSign, Package, AlertTriangle } from "lucide-react";
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getFinancialReport,
  getInventoryReport,
  getExpiringReport,
  downloadReportPDF,
} from "../services/reportsService";
import styles from "../styles/Reports.module.css";

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const REPORT_TYPES = [
  { value: "financial",  label: "Reporte Financiero"        },
  { value: "inventory",  label: "Reporte de Inventario"     },
  { value: "expiring",   label: "Medicamentos por Vencer"   },
];

function Skeleton({ className }) {
  return <div className={`${styles.skeleton} ${className ?? ""}`} />;
}

function daysClass(days, s) {
  if (days <= 15) return s.badgeRed;
  if (days <= 30) return s.badgeOrange;
  return s.badgeYellow;
}

function daysLabel(days) {
  if (days <= 15) return "Crítico";
  if (days <= 30) return "Advertencia";
  return "Monitorear";
}

export default function Reports() {
  const [reportType, setReportType] = useState("financial");
  const [dateFrom,   setDateFrom]   = useState("2024-01-01");
  const [dateTo,     setDateTo]     = useState("2024-06-30");

  const [financialData,   setFinancialData]   = useState(null);
  const [inventoryData,   setInventoryData]   = useState(null);
  const [expiringData,    setExpiringData]    = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [downloading,     setDownloading]     = useState(false);

  // ── Carga según tipo seleccionado ──────────────────────────────────────────
  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      if (reportType === "financial") {
        const data = await getFinancialReport(dateFrom, dateTo);
        setFinancialData(data);
      } else if (reportType === "inventory") {
        const data = await getInventoryReport(dateFrom, dateTo);
        setInventoryData(data);
      } else {
        const data = await getExpiringReport(dateFrom, dateTo);
        setExpiringData(data);
      }
    } finally {
      setLoading(false);
    }
  }, [reportType, dateFrom, dateTo]);

  useEffect(() => { loadReport(); }, [loadReport]);

  // ── Descargar PDF ──────────────────────────────────────────────────────────
  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadReportPDF(reportType, dateFrom, dateTo);
      alert("PDF descargado correctamente");
    } finally {
      setDownloading(false);
    }
  }

  // ── Gráfica financiera con utilidad calculada ──────────────────────────────
  const financialChart = financialData?.chart?.map((d) => ({
    ...d,
    utilidad: d.ingresos - d.egresos,
  })) ?? [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Encabezado */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Reportes</h1>
          <p className={styles.subtitle}>Genera y visualiza reportes del sistema</p>
        </div>
      </div>

      {/* Controles */}
      <div className={styles.controlsCard}>
        <div className={styles.controlsGrid}>
          <div className={styles.formGroup}>
            <label>Tipo de Reporte</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              {REPORT_TYPES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Fecha Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Fecha Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className={styles.formGroupBtn}>
            <button
              className={styles.btnDownload}
              onClick={handleDownload}
              disabled={downloading || loading}
            >
              <FileDown size={18} />
              {downloading ? "Descargando..." : "Descargar PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Reporte Financiero ── */}
      {reportType === "financial" && (
        <>
          <div className={styles.summaryGrid3}>
            {loading || !financialData
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={styles.summaryCard}>
                    <Skeleton className={styles.skeletonIcon} />
                    <Skeleton className={styles.skeletonLabel} />
                    <Skeleton className={styles.skeletonValue} />
                    <Skeleton className={styles.skeletonTrend} />
                  </div>
                ))
              : (
                <>
                  <div className={styles.summaryCard}>
                    <DollarSign size={28} color="#16a34a" />
                    <p className={styles.summaryLabel}>Ingresos Totales</p>
                    <p className={styles.summaryValue}>L. {financialData.summary.ingresos.toLocaleString()}</p>
                    <p className={styles.summaryTrendGreen}>{financialData.summary.trend} vs periodo anterior</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <DollarSign size={28} color="#dc2626" />
                    <p className={styles.summaryLabel}>Egresos Totales</p>
                    <p className={styles.summaryValue}>L. {financialData.summary.egresos.toLocaleString()}</p>
                    <p className={styles.summaryTrendMuted}>Gastos operativos</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <DollarSign size={28} color="#2563eb" />
                    <p className={styles.summaryLabel}>Utilidad Neta</p>
                    <p className={`${styles.summaryValue} ${styles.valueBlue}`}>L. {financialData.summary.utilidad.toLocaleString()}</p>
                    <p className={styles.summaryTrendBlue}>Margen: {financialData.summary.margen}%</p>
                  </div>
                </>
              )}
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Ingresos vs Egresos</h3>
              {loading
                ? <Skeleton className={styles.skeletonChart} />
                : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={financialChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="egresos"  fill="#ef4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </div>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Tendencia de Utilidad</h3>
              {loading
                ? <Skeleton className={styles.skeletonChart} />
                : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={financialChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="utilidad" stroke="#3b82f6" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
            </div>
          </div>
        </>
      )}

      {/* ── Reporte de Inventario ── */}
      {reportType === "inventory" && (
        <>
          <div className={styles.summaryGrid3}>
            {loading || !inventoryData
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={styles.summaryCard}>
                    <Skeleton className={styles.skeletonIcon} />
                    <Skeleton className={styles.skeletonLabel} />
                    <Skeleton className={styles.skeletonValue} />
                    <Skeleton className={styles.skeletonTrend} />
                  </div>
                ))
              : (
                <>
                  <div className={styles.summaryCard}>
                    <Package size={28} color="#2563eb" />
                    <p className={styles.summaryLabel}>Total Productos</p>
                    <p className={styles.summaryValue}>{inventoryData.summary.totalProducts.toLocaleString()}</p>
                    <p className={styles.summaryTrendMuted}>En inventario</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <DollarSign size={28} color="#16a34a" />
                    <p className={styles.summaryLabel}>Valor Total Inventario</p>
                    <p className={styles.summaryValue}>L. {inventoryData.summary.totalValue.toLocaleString()}</p>
                    <p className={styles.summaryTrendGreen}>Costo de reposición</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <AlertTriangle size={28} color="#f97316" />
                    <p className={styles.summaryLabel}>Productos Bajo Stock</p>
                    <p className={`${styles.summaryValue} ${styles.valueOrange}`}>{inventoryData.summary.lowStockCount}</p>
                    <p className={styles.summaryTrendOrange}>Requieren reabastecimiento</p>
                  </div>
                </>
              )}
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Distribución por Categoría</h3>
              {loading || !inventoryData
                ? <Skeleton className={styles.skeletonChart} />
                : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={inventoryData.categories}
                        cx="50%" cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={(e) => e.name}
                        labelLine={false}
                      >
                        {inventoryData.categories.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
            </div>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Resumen por Categoría</h3>
              {loading || !inventoryData
                ? <Skeleton className={styles.skeletonChart} />
                : (
                  <div className={styles.categoryList}>
                    {inventoryData.summary.categories.map((item, i) => (
                      <div key={i} className={styles.categoryRow}>
                        <div>
                          <p className={styles.categoryName}>{item.category}</p>
                          <p className={styles.categoryCount}>{item.products} productos</p>
                        </div>
                        <p className={styles.categoryValue}>L. {item.totalValue.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </>
      )}

      {/* ── Reporte de Medicamentos por Vencer ── */}
      {reportType === "expiring" && (
        <>
          {!loading && expiringData && expiringData.length > 0 && (
            <div className={styles.alertBanner}>
              <AlertTriangle size={22} color="#dc2626" />
              <div>
                <p className={styles.alertTitle}>Atención Requerida</p>
                <p className={styles.alertMsg}>
                  Hay <strong>{expiringData.length} productos</strong> próximos a vencer en los próximos 30 días.
                </p>
              </div>
            </div>
          )}

          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Medicamentos Próximos a Vencer</h3>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Fecha de Vencimiento</th>
                    <th>Días Restantes</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 5 }).map((__, j) => (
                            <td key={j}><Skeleton className={styles.skeletonText} /></td>
                          ))}
                        </tr>
                      ))
                    : (expiringData ?? []).map((p, i) => (
                        <tr key={i}>
                          <td className={styles.productName}>{p.name}</td>
                          <td className={styles.muted}>{p.quantity} unidades</td>
                          <td className={styles.muted}>{p.expiryDate}</td>
                          <td>
                            <span className={`${styles.badge} ${daysClass(p.daysLeft, styles)}`}>
                              {p.daysLeft} días
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${daysClass(p.daysLeft, styles)}`}>
                              {daysLabel(p.daysLeft)}
                            </span>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
