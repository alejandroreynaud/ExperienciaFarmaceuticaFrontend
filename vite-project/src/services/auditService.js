/**
 * auditService.js
 *
 * Registro de todos los movimientos del sistema.
 * Tipos: compra, venta, eliminacion_compra, eliminacion_venta,
 *        ingreso_lote, alta_producto, baja_producto,
 *        alta_proveedor, baja_proveedor
 * TODO: conectar con backend según endpoints indicados.
 */

const MOCK_AUDIT_LOGS = [
  {
    id: 1,
    movementId: "MOV-2024-001",
    movementType: "compra",
    description: "Registro de factura FAC-2024-001",
    user: "Administrador",
    date: "2024-03-10",
    time: "10:30:45",
    affectedProduct: "Paracetamol 500mg",
    quantity: 500,
    value: 1250,
  },
  {
    id: 2,
    movementId: "MOV-2024-002",
    movementType: "venta",
    description: "Venta #0015 procesada",
    user: "Administrador",
    date: "2024-03-10",
    time: "14:20:12",
    affectedProduct: "Ibuprofeno 400mg",
    quantity: 10,
    value: 85,
  },
  {
    id: 3,
    movementId: "MOV-2024-003",
    movementType: "eliminacion_venta",
    description: "Venta #0012 eliminada del sistema",
    user: "Administrador",
    date: "2024-03-09",
    time: "16:45:22",
    affectedProduct: "Amoxicilina 500mg",
    quantity: 5,
    value: 120,
  },
  {
    id: 4,
    movementId: "MOV-2024-004",
    movementType: "eliminacion_compra",
    description: "Factura FAC-2024-003 eliminada",
    user: "Administrador",
    date: "2024-03-08",
    time: "13:20:15",
    affectedProduct: "Losartán 50mg",
    quantity: 200,
    value: 1000,
  },
  {
    id: 5,
    movementId: "MOV-2024-005",
    movementType: "ingreso_lote",
    description: "Lote manual registrado",
    user: "Administrador",
    date: "2024-03-07",
    time: "08:10:00",
    affectedProduct: "Paracetamol 500mg",
    quantity: 100,
    value: 250,
  },
  {
    id: 6,
    movementId: "MOV-2024-006",
    movementType: "alta_producto",
    description: "Nuevo producto registrado en catálogo",
    user: "Administrador",
    date: "2024-03-07",
    time: "08:00:00",
    affectedProduct: "Losartán 50mg",
    quantity: null,
    value: null,
  },
  {
    id: 7,
    movementId: "MOV-2024-007",
    movementType: "alta_proveedor",
    description: "Proveedor registrado: Laboratorios Unidos",
    user: "Administrador",
    date: "2024-03-06",
    time: "09:00:00",
    affectedProduct: null,
    quantity: null,
    value: null,
  },
  {
    id: 8,
    movementId: "MOV-2024-008",
    movementType: "baja_proveedor",
    description: "Proveedor eliminado: Proveedora Salud",
    user: "Administrador",
    date: "2024-03-05",
    time: "17:30:00",
    affectedProduct: null,
    quantity: null,
    value: null,
  },
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Historial completo de movimientos.
 * TODO: reemplazar con → GET /api/audit/logs?page=1&limit=50
 */
export async function getAuditLogs() {
  await delay(600);
  return MOCK_AUDIT_LOGS;
}

/**
 * Conteos por tipo de movimiento.
 * TODO: reemplazar con → GET /api/audit/summary
 */
export async function getAuditSummary() {
  await delay(400);
  const logs = MOCK_AUDIT_LOGS;
  return {
    total:         logs.length,
    compras:       logs.filter((l) => l.movementType === "compra").length,
    ventas:        logs.filter((l) => l.movementType === "venta").length,
    eliminaciones: logs.filter((l) =>
      l.movementType === "eliminacion_compra" ||
      l.movementType === "eliminacion_venta"
    ).length,
    ingresos_lote: logs.filter((l) => l.movementType === "ingreso_lote").length,
    productos:     logs.filter((l) =>
      l.movementType === "alta_producto" ||
      l.movementType === "baja_producto"
    ).length,
    proveedores:   logs.filter((l) =>
      l.movementType === "alta_proveedor" ||
      l.movementType === "baja_proveedor"
    ).length,
  };
}