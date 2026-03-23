import React, { useState, useEffect } from "react";
import {
  Search, Filter, FileText, ShoppingCart,
  DollarSign, Trash2, Package, AlertCircle, Truck,
} from "lucide-react";
import { getAuditLogs, getAuditSummary } from "../services/auditService";
import styles from "../styles/Audit.module.css";

// ── Configuración visual por tipo ─────────────────────────────────────────────
const TYPE_CONFIG = {
  compra:             { label: "Compra",                  badgeClass: "badgeGreen",  Icon: ShoppingCart },
  venta:              { label: "Venta",                   badgeClass: "badgeBlue",   Icon: DollarSign   },
  eliminacion_compra: { label: "Eliminación de Compra",   badgeClass: "badgeRed",    Icon: Trash2       },
  eliminacion_venta:  { label: "Eliminación de Venta",    badgeClass: "badgeOrange", Icon: Trash2       },
  ingreso_lote:       { label: "Ingreso de Lote",         badgeClass: "badgePurple", Icon: Package      },
  alta_producto:      { label: "Alta de Producto",        badgeClass: "badgeTeal",   Icon: FileText     },
  baja_producto:      { label: "Baja de Producto",        badgeClass: "badgeRed",    Icon: AlertCircle  },
  alta_proveedor:     { label: "Alta de Proveedor",       badgeClass: "badgeTeal",   Icon: Truck        },
  baja_proveedor:     { label: "Baja de Proveedor",       badgeClass: "badgeOrange", Icon: Truck        },
};

const FILTER_OPTIONS = [
  { value: "todos",              label: "Todos los movimientos"     },
  { value: "compra",             label: "Compras"                   },
  { value: "venta",              label: "Ventas"                    },
  { value: "eliminacion_compra", label: "Eliminación de Compras"    },
  { value: "eliminacion_venta",  label: "Eliminación de Ventas"     },
  { value: "ingreso_lote",       label: "Ingresos de Lote"          },
  { value: "alta_producto",      label: "Altas de Producto"         },
  { value: "baja_producto",      label: "Bajas de Producto"         },
  { value: "alta_proveedor",     label: "Altas de Proveedor"        },
  { value: "baja_proveedor",     label: "Bajas de Proveedor"        },
];

// Tarjetas resumen
const SUMMARY_CARDS = [
  { label: "Total Movimientos", key: "total",         Icon: FileText,     colorClass: "iconBlue"   },
  { label: "Compras",           key: "compras",       Icon: ShoppingCart, colorClass: "iconGreen"  },
  { label: "Ventas",            key: "ventas",        Icon: DollarSign,   colorClass: "iconBlue"   },
  { label: "Eliminaciones",     key: "eliminaciones", Icon: Trash2,       colorClass: "iconRed"    },
  { label: "Ingresos Lote",     key: "ingresos_lote", Icon: Package,      colorClass: "iconPurple" },
  { label: "Productos",         key: "productos",     Icon: FileText,     colorClass: "iconTeal"   },
  { label: "Proveedores",       key: "proveedores",   Icon: Truck,        colorClass: "iconTeal"   },
];

function Skeleton({ className }) {
  return <div className={`${styles.skeleton} ${className ?? ""}`} />;
}

export default function Audit() {
  const [logs,    setLogs]    = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,     setSearch]     = useState("");
  const [filterType, setFilterType] = useState("todos");

  useEffect(() => {
    Promise.all([getAuditLogs(), getAuditSummary()])
      .then(([logData, sumData]) => {
        setLogs(logData);
        setSummary(sumData);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((log) => {
    const matchSearch =
      log.movementId.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      (log.affectedProduct ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "todos" || log.movementType === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className={styles.page}>

      {/* Encabezado */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Auditoría</h1>
          <p className={styles.subtitle}>Registro completo de movimientos del sistema</p>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.icon} />
          <input
            type="text"
            placeholder="Buscar por ID, descripción, producto o usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.selectWrap}>
          <Filter size={18} className={styles.icon} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={styles.select}
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className={styles.summaryGrid}>
        {SUMMARY_CARDS.map(({ label, key, Icon, colorClass }) => (
          <div key={key} className={styles.summaryCard}>
            <div className={`${styles.summaryIcon} ${styles[colorClass]}`}>
              <Icon size={20} />
            </div>
            <div className={styles.summaryText}>
              <p className={styles.summaryLabel}>{label}</p>
              {loading || !summary
                ? <Skeleton className={styles.skeletonValue} />
                : <p className={styles.summaryValue}>{summary[key]}</p>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>Historial de Movimientos</h3>
          {!loading && (
            <span className={styles.resultCount}>
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID Movimiento</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Producto / Proveedor</th>
                <th>Usuario</th>
                <th>Fecha y Hora</th>
                <th>Cantidad</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j}><Skeleton className={styles.skeletonText} /></td>
                      ))}
                    </tr>
                  ))
                : filtered.length === 0
                ? (
                    <tr>
                      <td colSpan={8} className={styles.emptyRow}>
                        <FileText size={36} color="#d1d5db" />
                        <p>No se encontraron movimientos</p>
                        <span>Intenta ajustar los filtros de búsqueda</span>
                      </td>
                    </tr>
                  )
                : filtered.map((log) => {
                    const cfg = TYPE_CONFIG[log.movementType] ?? TYPE_CONFIG["compra"];
                    const Icon = cfg.Icon;
                    return (
                      <tr key={log.id}>
                        <td className={styles.movementId}>{log.movementId}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[cfg.badgeClass]}`}>
                            <Icon size={12} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className={styles.description}>{log.description}</td>
                        <td className={styles.muted}>{log.affectedProduct ?? "—"}</td>
                        <td className={styles.muted}>{log.user}</td>
                        <td>
                          <div className={styles.dateCell}>
                            <span>{log.date}</span>
                            <span className={styles.time}>{log.time}</span>
                          </div>
                        </td>
                        <td className={styles.muted}>
                          {log.quantity != null ? `${log.quantity} uds.` : "—"}
                        </td>
                        <td className={styles.valueCell}>
                          {log.value != null ? `L. ${Number(log.value).toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
