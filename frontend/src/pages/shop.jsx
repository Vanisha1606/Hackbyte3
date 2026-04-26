import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Plus, Minus, Pill } from "lucide-react";
import { api } from "../utils/api";
import { useToast } from "../components/Toast";
import { addToCart } from "../utils/cart";
import "./shop.css";

const Shop = () => {
  const [meds, setMeds] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState({});
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    api
      .get("/api/medicines")
      .then((r) => setMeds(r.data || []))
      .catch(() => toast.error("Could not load medicines"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return meds;
    const q = search.toLowerCase();
    return meds.filter(
      (m) =>
        m.med_name?.toLowerCase().includes(q) ||
        m.med_desc?.toLowerCase().includes(q)
    );
  }, [meds, search]);

  const setQuantity = (id, delta) => {
    setQty((p) => ({ ...p, [id]: Math.max(1, (p[id] || 1) + delta) }));
  };

  const handleAdd = (m) => {
    const id = m._id || m.med_name;
    const q = qty[id] || 1;
    addToCart(
      {
        id,
        name: m.med_name,
        price: m.med_price,
        description: m.med_desc,
      },
      q
    );
    toast.success(`Added ${q} × ${m.med_name} to cart`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pharmacy shop</h1>
          <p className="page-subtitle">
            Browse, compare, and order medicines instantly.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/cart")}>
          <ShoppingBag size={16} /> Go to cart
        </button>
      </div>

      <div className="shop-search">
        <Search size={16} />
        <input
          placeholder="Search by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="med-grid">
          {[...Array(6)].map((_, i) => (
            <div className="card med-card" key={i}>
              <div className="skeleton" style={{ height: 100 }} />
              <div
                className="skeleton"
                style={{ height: 14, width: "70%", marginTop: 14 }}
              />
              <div
                className="skeleton"
                style={{ height: 12, width: "50%", marginTop: 8 }}
              />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No medicines match "{search}"</h3>
          <p>Try a different search term.</p>
        </div>
      ) : (
        <div className="med-grid">
          {filtered.map((m) => {
            const id = m._id || m.med_name;
            const q = qty[id] || 1;
            const soldOut = m.med_quantity <= 0;
            return (
              <div className="card med-card" key={id}>
                <div className="med-thumb">
                  <Pill size={28} />
                </div>
                <h3 className="med-title">{m.med_name}</h3>
                <p className="med-desc">{m.med_desc || "—"}</p>
                {m.side_effects && (
                  <p className="med-side">⚠ {m.side_effects}</p>
                )}
                <div className="med-foot">
                  <span className="med-price">₹{m.med_price}</span>
                  {soldOut ? (
                    <span className="badge badge-danger">Out of stock</span>
                  ) : (
                    <span className="badge badge-success">
                      {m.med_quantity} in stock
                    </span>
                  )}
                </div>
                {soldOut ? (
                  <button
                    className="btn btn-secondary btn-block"
                    onClick={() => toast.info("Request sent to pharmacist!")}
                  >
                    Request restock
                  </button>
                ) : (
                  <div className="med-actions">
                    <div className="qty">
                      <button onClick={() => setQuantity(id, -1)}>
                        <Minus size={14} />
                      </button>
                      <span>{q}</span>
                      <button onClick={() => setQuantity(id, 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleAdd(m)}
                    >
                      Add to cart
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Shop;
