import { LogOut, Menu, X } from "lucide-react";
import styles from "../styles/Header.module.css";

export default function Header({ sidebarOpen, onToggleSidebar, onLogout }) {
  return (
    <header className={styles.header}>

      {/* Botón toggle del sidebar */}
      <button
        className={styles.menuBtn}
        onClick={onToggleSidebar}
        aria-label="Toggle menú"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Spacer */}
      <div className={styles.spacer} />

      {/* Usuario + Logout */}
      <div className={styles.userArea}>
        <div className={styles.avatar}>AD</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>Administrador</span>
          <span className={styles.userEmail}>admin@farmacia.com</span>
        </div>
        <button
          className={styles.logoutBtn}
          onClick={onLogout}
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </div>

    </header>
  );
}
