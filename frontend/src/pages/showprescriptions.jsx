import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  Upload,
  FileText,
  Calendar,
  Trash2,
  Loader2,
  ImageOff,
  ShoppingCart,
} from "lucide-react";
import { api } from "../utils/api";
import { addToCart } from "../utils/cart";
import { useToast } from "../components/Toast";
import "./showprescriptions.css";

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ShowPrescriptions = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/api/prescriptions");
      setItems(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      if (e?.response?.status === 401) {
        toast.info("Sign in to see your prescription history.");
        navigate("/login");
        return;
      }
      toast.error("Failed to load prescriptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (id) => {
    if (!confirm("Delete this prescription?")) return;
    try {
      await api.delete(`/api/prescriptions/${id}`);
      setItems((prev) => prev.filter((p) => p._id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Couldn't delete");
    }
  };

  const parseValidatedToItems = (md) => {
    if (!md || typeof md !== "string") return [];
    return md
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("-"))
      .map((l) => l.replace(/^-+\s*/, "").trim())
      .filter((l) => l && !l.toLowerCase().includes("(none detected)"))
      .map((line) => {
        const m = line.match(/\|\s*qty:\s*(\d+)/i);
        const qty = m ? Math.max(1, parseInt(m[1], 10)) : 1;
        const name = m
          ? line.slice(0, m.index).replace(/\|\s*$/, "").trim()
          : line;
        return { name, quantity: qty };
      });
  };

  const addItemsToCart = async (rx) => {
    let list = Array.isArray(rx?.items) ? rx.items : [];
    if (!list.length) list = parseValidatedToItems(rx?.medicines);
    if (!list.length) {
      toast.info("No medicines could be extracted from this prescription.");
      return;
    }
    const summary = list
      .map((i) => `• ${i.name} (x${i.quantity})`)
      .join("\n");
    if (!confirm(
      `Add ${list.length} medicine(s) to your cart?\n\n${summary}`
    )) return;
    let catalog = [];
    try {
      const r = await api.get("/api/medicines");
      catalog = Array.isArray(r.data) ? r.data : [];
    } catch {
      catalog = [];
    }
    const findMatch = (name) => {
      const n = (name || "").toLowerCase();
      return catalog.find((m) => {
        const mn = (m.med_name || "").toLowerCase();
        return mn && (mn === n || n.includes(mn) || mn.includes(n));
      });
    };
    let matched = 0;
    let unmatched = 0;
    for (const it of list) {
      const m = findMatch(it.name);
      if (m) {
        addToCart(
          {
            id: m._id || m.id || `med-${m.med_name}`,
            name: m.med_name,
            description: m.med_desc || "",
            price: Number(m.med_price) || 0,
            image: m.image || "",
          },
          Number(it.quantity) || 1
        );
        matched += 1;
      } else {
        addToCart(
          {
            id: `rx-${(it.name || "med").toLowerCase().replace(/\s+/g, "-")}`,
            name: it.name,
            description: "From prescription (price pending)",
            price: 0,
            image: "",
          },
          Number(it.quantity) || 1
        );
        unmatched += 1;
      }
    }
    toast.success(
      unmatched
        ? `Added ${matched + unmatched}. ${unmatched} need price confirmation.`
        : `Added ${matched} item(s) to your cart.`
    );
    navigate("/cart");
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My prescriptions</h1>
          <p className="page-subtitle">
            All your past prescriptions in one beautifully tidy place.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/uploadprescription")}
        >
          <Upload size={16} /> Upload new
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <Loader2 className="spin" size={20} />
          <p>Loading your prescriptions…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h3>No prescriptions yet</h3>
          <p>Upload your first prescription to get started.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            onClick={() => navigate("/uploadprescription")}
          >
            <Upload size={16} /> Upload prescription
          </button>
        </div>
      ) : (
        <div className="rx-list">
          {items.map((p) => (
            <div className="card rx-card" key={p._id}>
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="prescription" />
              ) : (
                <div className="rx-noimg">
                  <ImageOff size={28} />
                  <span>Text-only entry</span>
                </div>
              )}
              <div className="rx-body">
                <div className="rx-meta">
                  <span className="badge">
                    <FileText size={12} /> {p.engine || "manual"}
                  </span>
                  <span className="rx-date">
                    <Calendar size={14} /> {formatDate(p.createdAt)}
                  </span>
                  <button
                    className="icon-btn rx-delete"
                    onClick={() => remove(p._id)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {p.medicines && (
                  <div className="rx-section">
                    <h4>Medicines</h4>
                    <ReactMarkdown>{p.medicines}</ReactMarkdown>
                    <button
                      className="btn btn-primary btn-sm rx-addcart"
                      onClick={() => addItemsToCart(p)}
                    >
                      <ShoppingCart size={14} /> Add to cart
                    </button>
                  </div>
                )}
                {p.extractedText && (
                  <details className="rx-extra">
                    <summary>Original extracted text</summary>
                    <pre>{p.extractedText}</pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShowPrescriptions;
