import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  UserCircle,
  FileText,
  Pill,
} from "lucide-react";
import styles from "../styles/Sidebar.module.css";

const menuItems = [
  { path: "/",           label: "Dashboard", icon: LayoutDashboard },
  { path: "/inventario", label: "Inventario", icon: Package         },
  { path: "/compras",    label: "Compras",    icon: ShoppingCart    },
  { path: "/ventas",     label: "Ventas",     icon: DollarSign      },
  { path: "/clientes",   label: "Clientes",   icon: UserCircle      },
  { path: "/reportes",   label: "Reportes",   icon: FileText        },
];

export default function Sidebar({ open }) {
  return (
    <aside className={`${styles.sidebar} ${open ? styles.open : styles.closed}`}>

      {/* Logo / Brand */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <Pill size={22} color="#fff" />
        </div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>FarmaSystem</span>
          <span className={styles.brandSub}>Gestión Integral</span>
        </div>
      </div>

      {/* Navegación */}
      <nav className={styles.nav}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ""}`
              }
            >
              <Icon size={20} />
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

    </aside>
  );
}
