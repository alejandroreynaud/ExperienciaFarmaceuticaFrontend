import { useState, useEffect, useCallback } from "react";
import { FileDown, Package, AlertTriangle, Boxes } from "lucide-react";
import {
  getExpiringReport,
  getLowStockReport,
  getStockSummaryReport,
  getSalesReport,
  downloadReportPDF,
} from "../services/reportsService";
import styles from "../styles/Reports.module.css";

const REPORT_TYPES = [
  { value: "expiring", label: "Productos por Vencer" },
  { value: "low-stock", label: "Productos con Bajo Stock" },
  { value: "stock", label: "Stock Total del Inventario" },
  { value: "sales", label: "Reporte de Ventas" },
];

function Skeleton({ className }) {
  return <div className={`${styles.skeleton} ${className ?? ""}`} />;
}

function daysClass(days, s) {
  if (days <= 7) return s.badgeRed;
  if (days <= 30) return s.badgeOrange;
  return s.badgeYellow;
}

function daysLabel(days) {
  if (days <= 7) return "Critico";
  if (days <= 30) return "Advertencia";
  return "Monitorear";
}

export default function Reports() {
  const [reportType, setReportType] = useState("expiring");
  const [daysWindow, setDaysWindow] = useState("30");
  const [stockThreshold, setStockThreshold] = useState("10");
  const [salesDate, setSalesDate] = useState(new Date().toISOString().slice(0, 10));

  const [expiringData, setExpiringData] = useState([]);
  const [lowStockData, setLowStockData] = useState([]);
  const [stockData, setStockData] = useState(null);
  const [salesData, setSalesData] = useState({ summary: { totalVentas: 0, totalMonto: 0, totalUnidades: 0, porMetodo: {} }, ventas: [] });

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      if (reportType === "expiring") {
        const data = await getExpiringReport(daysWindow);
        setExpiringData(data);
      } else if (reportType === "low-stock") {
        const data = await getLowStockReport(stockThreshold);
        setLowStockData(data);
      } else if (reportType === "stock") {
        const data = await getStockSummaryReport();
        setStockData(data);
      } else {
        const data = await getSalesReport(salesDate);
        setSalesData(data);
      }
    } finally {
      setLoading(false);
    }
  }, [reportType, daysWindow, stockThreshold, salesDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadReportPDF(reportType, {
        days: Number(daysWindow) || 30,
        threshold: Number(stockThreshold) || 10,
      });
      alert("PDF descargado correctamente");
    } catch (error) {
      alert(error?.message || "No se pudo descargar el PDF");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Reportes</h1>
          <p className={styles.subtitle}>Controla vencimientos, bajo stock y estado general del inventario</p>
        </div>
      </div>

      <div className={styles.controlsCard}>
        <div className={styles.controlsGrid}>
          <div className={styles.formGroup}>
            <label>Tipo de reporte</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              {REPORT_TYPES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {reportType === "expiring" && (
            <div className={styles.formGroup}>
              <label>Ventana de dias</label>
              <input
                type="number"
                min="1"
                value={daysWindow}
                onChange={(e) => setDaysWindow(e.target.value)}
              />
            </div>
          )}

          {reportType === "low-stock" && (
            <div className={styles.formGroup}>
              <label>Umbral de stock</label>
              <input
                type="number"
                min="0"
                value={stockThreshold}
                onChange={(e) => setStockThreshold(e.target.value)}
              />
            </div>
          )}

          {reportType === "sales" && (
            <div className={styles.formGroup}>
              <label>Fecha de ventas</label>
              <input
                type="date"
                value={salesDate}
                onChange={(e) => setSalesDate(e.target.value)}
              />
            </div>
          )}

          <div className={styles.formGroupBtn}>
            <button className={styles.btnDownload} onClick={handleDownload} disabled={loading || downloading}>
              <FileDown size={18} />
              {downloading ? "Descargando..." : "Descargar PDF"}
            </button>
          </div>
        </div>
      </div>

      {reportType === "expiring" && (
        <>
          {!loading && expiringData.length > 0 && (
            <div className={styles.alertBanner}>
              <AlertTriangle size={22} color="#dc2626" />
              <div>
                <p className={styles.alertTitle}>Atencion requerida</p>
                <p className={styles.alertMsg}>
                  Hay <strong>{expiringData.length}</strong> lote(s) con vencimiento dentro del rango evaluado.
                </p>
              </div>
            </div>
          )}

          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Productos por vencer</h3>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Vence</th>
                    <th>Dias</th>
                    <th>Estado</th>
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
                    : expiringData.length === 0
                      ? (
                        <tr><td colSpan={6} className={styles.emptyRow}>No hay lotes por vencer en el rango seleccionado</td></tr>
                      )
                      : expiringData.map((p) => (
                          <tr key={p.id}>
                            <td className={styles.muted}>{p.code}</td>
                            <td className={styles.productName}>{p.name}</td>
                            <td className={styles.muted}>{p.quantity}</td>
                            <td className={styles.muted}>{p.expiryDate}</td>
                            <td>
                              <span className={`${styles.badge} ${daysClass(p.daysLeft, styles)}`}>
                                {p.daysLeft}
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

      {reportType === "low-stock" && (
        <>
          <div className={styles.summaryGrid3}>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={styles.summaryCard}>
                    <Skeleton className={styles.skeletonIcon} />
                    <Skeleton className={styles.skeletonLabel} />
                    <Skeleton className={styles.skeletonValue} />
                  </div>
                ))
              : (
                <>
                  <div className={styles.summaryCard}>
                    <AlertTriangle size={28} color="#f97316" />
                    <p className={styles.summaryLabel}>Productos bajo stock</p>
                    <p className={`${styles.summaryValue} ${styles.valueOrange}`}>{lowStockData.length}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <Package size={28} color="#2563eb" />
                    <p className={styles.summaryLabel}>Umbral aplicado</p>
                    <p className={styles.summaryValue}>{Number(stockThreshold) || 10}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <Boxes size={28} color="#16a34a" />
                    <p className={styles.summaryLabel}>Stock acumulado</p>
                    <p className={styles.summaryValue}>{lowStockData.reduce((s, i) => s + i.stock, 0)}</p>
                  </div>
                </>
              )}
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Productos con bajo stock</h3>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Producto</th>
                    <th>Stock actual</th>
                    <th>Umbral</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 4 }).map((__, j) => (
                            <td key={j}><Skeleton className={styles.skeletonText} /></td>
                          ))}
                        </tr>
                      ))
                    : lowStockData.length === 0
                      ? <tr><td colSpan={4} className={styles.emptyRow}>No hay productos por debajo del umbral</td></tr>
                      : lowStockData.map((p) => (
                          <tr key={p.id}>
                            <td className={styles.muted}>{p.code}</td>
                            <td className={styles.productName}>{p.name}</td>
                            <td><span className={`${styles.badge} ${styles.badgeOrange}`}>{p.stock}</span></td>
                            <td className={styles.muted}>{p.threshold}</td>
                          </tr>
                        ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {reportType === "stock" && (
        <>
          <div className={styles.summaryGrid3}>
            {loading || !stockData
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={styles.summaryCard}>
                    <Skeleton className={styles.skeletonIcon} />
                    <Skeleton className={styles.skeletonLabel} />
                    <Skeleton className={styles.skeletonValue} />
                  </div>
                ))
              : (
                <>
                  <div className={styles.summaryCard}>
                    <Package size={28} color="#2563eb" />
                    <p className={styles.summaryLabel}>Total productos</p>
                    <p className={styles.summaryValue}>{stockData.summary.totalProducts}</p>
                    <p className={styles.summaryTrendMuted}>Activos: {stockData.summary.activeProducts} | Inactivos: {stockData.summary.inactiveProducts}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <Boxes size={28} color="#16a34a" />
                    <p className={styles.summaryLabel}>Stock total</p>
                    <p className={styles.summaryValue}>{stockData.summary.totalStock}</p>
                    <p className={styles.summaryTrendMuted}>Unidades acumuladas</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <FileDown size={28} color="#f59e0b" />
                    <p className={styles.summaryLabel}>Valor estimado</p>
                    <p className={`${styles.summaryValue} ${styles.valueOrange}`}>L. {Math.round(stockData.summary.totalValue).toLocaleString()}</p>
                    <p className={styles.summaryTrendMuted}>Precio venta x stock</p>
                  </div>
                </>
              )}
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Detalle de stock por producto</h3>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Producto</th>
                    <th>Estado</th>
                    <th>Stock</th>
                    <th>Precio</th>
                    <th>Lotes activos/totales</th>
                  </tr>
                </thead>
                <tbody>
                  {loading || !stockData
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 6 }).map((__, j) => (
                            <td key={j}><Skeleton className={styles.skeletonText} /></td>
                          ))}
                        </tr>
                      ))
                    : stockData.products.length === 0
                      ? <tr><td colSpan={6} className={styles.emptyRow}>No hay productos para mostrar</td></tr>
                      : stockData.products.map((p) => (
                          <tr key={p.code}>
                            <td className={styles.muted}>{p.code}</td>
                            <td className={styles.productName}>{p.name}</td>
                            <td>
                              <span className={`${styles.badge} ${p.active ? styles.badgeYellow : styles.badgeRed}`}>
                                {p.active ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td className={styles.muted}>{p.stock}</td>
                            <td className={styles.muted}>L. {p.price.toFixed(2)}</td>
                            <td className={styles.muted}>{p.activeLots}/{p.totalLots}</td>
                          </tr>
                        ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {reportType === "sales" && (
        <>
          <div className={styles.summaryGrid3}>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={styles.summaryCard}>
                    <Skeleton className={styles.skeletonIcon} />
                    <Skeleton className={styles.skeletonLabel} />
                    <Skeleton className={styles.skeletonValue} />
                  </div>
                ))
              : (
                <>
                  <div className={styles.summaryCard}>
                    <Package size={28} color="#2563eb" />
                    <p className={styles.summaryLabel}>Ventas del día</p>
                    <p className={styles.summaryValue}>{salesData.summary.totalVentas}</p>
                    <p className={styles.summaryTrendMuted}>Fecha: {salesDate}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <Boxes size={28} color="#16a34a" />
                    <p className={styles.summaryLabel}>Monto total</p>
                    <p className={`${styles.summaryValue} ${styles.valueBlue}`}>L. {Number(salesData.summary.totalMonto || 0).toFixed(2)}</p>
                    <p className={styles.summaryTrendMuted}>Suma de tickets</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <AlertTriangle size={28} color="#f59e0b" />
                    <p className={styles.summaryLabel}>Unidades vendidas</p>
                    <p className={styles.summaryValue}>{salesData.summary.totalUnidades}</p>
                    <p className={styles.summaryTrendMuted}>Cantidad total de items</p>
                  </div>
                </>
              )}
          </div>

          {!loading && (
            <div className={styles.controlsCard}>
              <p className={styles.summaryLabel}>
                Metodo de pago:
                {Object.keys(salesData.summary.porMetodo || {}).length === 0
                  ? " Sin datos"
                  : ` ${Object.entries(salesData.summary.porMetodo)
                      .map(([k, v]) => `${k}: L. ${Number(v).toFixed(2)}`)
                      .join(" | ")}`}
              </p>
            </div>
          )}

          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Detalle de ventas</h3>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Venta</th>
                    <th>Factura</th>
                    <th>Cliente</th>
                    <th>Método</th>
                    <th>Items</th>
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
                    : salesData.ventas.length === 0
                      ? <tr><td colSpan={6} className={styles.emptyRow}>No hay ventas registradas en la fecha seleccionada</td></tr>
                      : salesData.ventas.map((v) => (
                          <tr key={v.id}>
                            <td className={styles.muted}>{v.id}</td>
                            <td className={styles.productName}>{v.numeroFactura}</td>
                            <td className={styles.muted}>{v.clienteId}</td>
                            <td className={styles.muted}>{v.metodoPago}</td>
                            <td className={styles.muted}>{v.items}</td>
                            <td className={styles.muted}>L. {Number(v.total).toFixed(2)}</td>
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
