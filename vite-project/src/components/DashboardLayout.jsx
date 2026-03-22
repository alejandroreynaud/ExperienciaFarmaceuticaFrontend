import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import styles from "../styles/DashboardLayout.module.css";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={styles.layout}>

      <Sidebar open={sidebarOpen} />

      {/* Overlay para móvil: cierra el sidebar al tocar fuera */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Columna principal: header + contenido */}
      <div
        className={styles.main}
        style={{ marginLeft: sidebarOpen ? "256px" : "0" }}
      >
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

    </div>
  );
}
