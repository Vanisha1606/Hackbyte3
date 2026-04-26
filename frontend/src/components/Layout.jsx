import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./layout.css";

const Layout = () => {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1100;
  });

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 900) setCollapsed(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className={`shell ${collapsed ? "shell-collapsed" : ""}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="shell-main">
        <Topbar />
        <main className="shell-content fade-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
