import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard  from "./pages/Dashboard";
import Inventory  from "./pages/Inventory";
import Purchases  from "./pages/Purchases";
import Sales      from "./pages/Sales";
import Reports    from "./pages/Reports";
import Audit      from "./pages/Audit";



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inventario" element={<Inventory />} />
          <Route path="compras" element={<Purchases />} />
          <Route path="ventas" element={<Sales />} />
          <Route path="reportes" element={<Reports />} />
          <Route path="auditoria" element={<Audit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
