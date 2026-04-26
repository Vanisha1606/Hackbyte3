import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShoppingCart, Bell, Search } from "lucide-react";
import { isAuthed, getStoredUser } from "../utils/auth";
import { cartCount } from "../utils/cart";
import "./topbar.css";

const Topbar = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState(cartCount());
  const user = getStoredUser();
  const authed = isAuthed();

  useEffect(() => {
    const handler = () => setCount(cartCount());
    window.addEventListener("cart:update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("cart:update", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const initial = user?.firstName?.[0]?.toUpperCase() || "U";

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={16} />
        <input
          placeholder="Search medicines, doctors, prescriptions…"
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate("/shop");
          }}
        />
      </div>

      <div className="topbar-actions">
        <button
          className="icon-btn cart-btn"
          onClick={() => navigate("/cart")}
          aria-label="Cart"
        >
          <ShoppingCart size={18} />
          {count > 0 && <span className="cart-badge">{count}</span>}
        </button>

        <button className="icon-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>

        {authed ? (
          <Link to="/profilepage" className="topbar-user" title="Profile">
            <div className="avatar">{initial}</div>
            <div className="user-meta">
              <strong>
                {user?.firstName || "User"} {user?.lastName || ""}
              </strong>
              <small>{user?.email || ""}</small>
            </div>
          </Link>
        ) : (
          <div className="topbar-cta">
            <Link to="/login" className="btn btn-ghost">
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
