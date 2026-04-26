import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Pill,
  ShoppingBag,
  Bot,
  Boxes,
  UserCircle,
  Info,
  LogOut,
  LogIn,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { isAuthed, clearSession } from "../utils/auth";
import "./sidebar.css";

const NAV = [
  { to: "/home", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/profilepage", icon: UserCircle, label: "Profile" },
  { to: "/timetable", icon: CalendarDays, label: "Timetable" },
  { to: "/appointment", icon: ClipboardList, label: "Appointment" },
  { to: "/uploadprescription", icon: Pill, label: "Prescription AI" },
  { to: "/showprescriptions", icon: ClipboardList, label: "My Prescriptions" },
  { to: "/shop", icon: ShoppingBag, label: "Pharmacy Shop" },
  { to: "/chatbot", icon: Bot, label: "PharmaBot" },
  { to: "/admin_inventory", icon: Boxes, label: "Inventory" },
  { to: "/aboutus", icon: Info, label: "About" },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const authed = isAuthed();

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-mark">P+</div>
        {!collapsed && (
          <div className="brand-text">
            <strong>PharmaHub</strong>
            <small>AI Health Companion</small>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-item ${isActive ? "is-active" : ""}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} strokeWidth={2.2} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        {authed ? (
          <button className="nav-item nav-foot" onClick={logout}>
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        ) : (
          <NavLink to="/login" className="nav-item nav-foot">
            <LogIn size={18} />
            {!collapsed && <span>Login</span>}
          </NavLink>
        )}
        <button
          className="collapse-btn"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
