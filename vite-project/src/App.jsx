import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard  from "./pages/Dashboard";
import Inventory  from "./pages/Inventory";
//import Purchases  from "./pages/Purchases";
//import Sales      from "./pages/Sales";
//import Clients    from "./pages/Clients";
//import Reports    from "./pages/Reports";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* DashboardLayout actúa como wrapper: renderiza Sidebar + Header
            y usa <Outlet /> para mostrar la página activa adentro */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index         element={<Dashboard />}  />
          <Route path="inventario" element={<Inventory />} />
          {/*
          
          <Route path="compras"    element={<Purchases />} />
          <Route path="ventas"     element={<Sales />}     />
          <Route path="clientes"   element={<Clients />}   />
          <Route path="reportes"   element={<Reports />}   />
          */}
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
