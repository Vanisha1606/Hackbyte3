import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  UploadCloud,
  ScanLine,
  X,
  Sparkles,
  Trash2,
  History,
  ShoppingCart,
  Plus,
  Check,
} from "lucide-react";
import { api, aiApi } from "../utils/api";
import { isAuthed } from "../utils/auth";
import { addToCart } from "../utils/cart";
import { useToast } from "../components/Toast";
import "./uploadprescription.css";

// Parse "[- ]Name | qty: N | price: P" markdown into [{ name, quantity, price }]
// (fallback when the AI service didn't return a structured array).
// Gemini sometimes drops the leading "- " bullet, so we strip any leading
// list markers (-, *, "1.", whitespace) and then look for the qty/price pipes.
const parseValidatedToItems = (md) => {
  if (!md || typeof md !== "string") return [];
  return md
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
    .filter((l) => l && !l.toLowerCase().includes("(none detected)"))
    .map((line) => {
      const qm = line.match(/\|\s*qty:\s*(\d+)/i);
      const pm = line.match(/\|\s*price:\s*[^\d]*(\d+(?:\.\d+)?)/i);
      // Only treat lines that actually carry a qty/price marker as items,
      // so prose lines from Gemini don't pollute the table.
      if (!qm && !pm) return null;
      const qty = qm ? Math.max(1, parseInt(qm[1], 10)) : 1;
      const price = pm ? Number(pm[1]) : 0;
      const cuts = [qm?.index, pm?.index].filter((x) => x != null);
      const name = cuts.length
        ? line.slice(0, Math.min(...cuts)).replace(/\|\s*$/, "").trim()
        : line;
      return name ? { name, quantity: qty, price } : null;
    })
    .filter(Boolean);
};

const UploadPrescription = () => {
  const fileInput = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [adding, setAdding] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const onPick = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onPick(f);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setText("");
    setShowPrompt(false);
  };

  const handleAnalyze = async () => {
    if (!file && !text) {
      return toast.error("Please upload a prescription image or enter text.");
    }
    setLoading(true);
    setResult(null);
    try {
      // If logged in, go through Node so we get Cloudinary upload + Mongo persistence.
      if (isAuthed()) {
        const fd = new FormData();
        if (file) fd.append("file", file);
        if (text) fd.append("text", text);
        const r = await api.post("/api/prescriptions", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const saved = r.data || {};
        const items =
          Array.isArray(saved.items) && saved.items.length
            ? saved.items
            : parseValidatedToItems(saved.medicines);
        const next = {
          extracted: saved.extractedText || "",
          validated: saved.medicines || "",
          details: saved.details || {},
          items: normalizeItems(items),
          imageUrl: saved.imageUrl || preview,
          saved: true,
        };
        setResult(next);
        toast.success("Prescription saved to your history.");
        if (next.items.length) setTimeout(() => setShowPrompt(true), 200);
      } else {
        // Anonymous: hit FastAPI directly (nothing persisted)
        let extractedText = text;
        if (file) {
          const fd = new FormData();
          fd.append("file", file);
          const r = await aiApi.post("/extract_text/", fd);
          extractedText = r.data?.extracted_text || "";
        }
        const v = await aiApi.post("/validate_prescription/", {
          text: extractedText,
        });
        const items =
          Array.isArray(v.data?.medicines) && v.data.medicines.length
            ? v.data.medicines
            : parseValidatedToItems(v.data?.validated);
        const next = {
          extracted: extractedText,
          validated: v.data?.validated || "",
          details: v.data?.details || {},
          items: normalizeItems(items),
          imageUrl: preview,
          saved: false,
        };
        setResult(next);
        toast.success("Prescription analyzed (sign in to save it).");
        if (next.items.length) setTimeout(() => setShowPrompt(true), 200);
      }
    } catch (e) {
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.detail ||
          "AI service unavailable. Make sure FastAPI (8001), Node (5001) and Tesseract are running."
      );
    } finally {
      setLoading(false);
    }
  };

  const addItemsNow = async (items) => {
    if (!items?.length) return;
    setAdding(true);
    try {
      let catalog = [];
      try {
        const r = await api.get("/api/medicines");
        catalog = Array.isArray(r.data) ? r.data : [];
      } catch {
        catalog = [];
      }
      const findMatch = (name) => {
        const n = (name || "").toLowerCase().trim();
        if (!n) return null;
        return catalog.find((m) => {
          const mn = (m.med_name || "").toLowerCase();
          return mn && (mn === n || n.includes(mn) || mn.includes(n));
        });
      };
      let matched = 0;
      let unmatched = 0;
      for (const it of items) {
        const name = (it.name || "").trim();
        if (!name) continue;
        const qty = Math.max(1, Number(it.quantity) || 1);
        const userPrice = Number(it.price) || 0;
        const m = findMatch(name);
        if (m) {
          // Use the price the user sees/edited in the table; fall back to catalog price.
          const price = userPrice > 0 ? userPrice : Number(m.med_price) || 0;
          addToCart(
            {
              id: m._id || m.id || `med-${m.med_name}`,
              name: m.med_name,
              description: m.med_desc || "",
              price,
              image: m.image || "",
            },
            qty
          );
          matched += 1;
        } else {
          const price = userPrice > 0 ? userPrice : 50;
          addToCart(
            {
              id: `rx-${name.toLowerCase().replace(/\s+/g, "-")}`,
              name,
              description: "From prescription",
              price,
              image: "",
            },
            qty
          );
          unmatched += 1;
        }
      }
      toast.success(
        unmatched
          ? `Added ${matched + unmatched} item(s). ${unmatched} use the price you set.`
          : `Added ${matched} item(s) to your cart.`
      );
      navigate("/cart");
    } finally {
      setAdding(false);
      setShowPrompt(false);
    }
  };

  // --- editable items helpers -------------------------------------------------
  const updateItem = (idx, field, value) => {
    setResult((prev) => {
      if (!prev) return prev;
      const next = [...(prev.items || [])];
      const cur = { ...next[idx] };
      if (field === "quantity") {
        const n = parseInt(value, 10);
        cur.quantity = Number.isFinite(n) && n > 0 ? n : 1;
      } else if (field === "price") {
        const n = parseFloat(value);
        cur.price = Number.isFinite(n) && n >= 0 ? n : 0;
      } else {
        cur[field] = value;
      }
      next[idx] = cur;
      return { ...prev, items: next };
    });
  };

  const removeItem = (idx) => {
    setResult((prev) => {
      if (!prev) return prev;
      const next = (prev.items || []).filter((_, i) => i !== idx);
      return { ...prev, items: next };
    });
  };

  const addItem = () => {
    setResult((prev) => {
      if (!prev) return prev;
      const next = [
        ...(prev.items || []),
        { name: "", quantity: 1, price: 0 },
      ];
      return { ...prev, items: next };
    });
  };

  const itemsTotal = (items) =>
    (items || []).reduce(
      (acc, it) =>
        acc + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Prescription AI</h1>
          <p className="page-subtitle">
            Upload an image or paste text — we'll decode it for you.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(file || result) && (
            <button className="btn btn-ghost" onClick={reset}>
              <Trash2 size={16} /> Reset
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/showprescriptions")}
          >
            <History size={16} /> History
          </button>
        </div>
      </div>

      <div className="upload-grid">
        <div
          className={`card upload-drop ${preview ? "has-file" : ""}`}
          onClick={() => fileInput.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {preview ? (
            <>
              <img src={preview} alt="Prescription" className="upload-preview" />
              <button
                className="upload-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
                }}
                aria-label="Remove file"
              >
                <X size={16} />
              </button>
              <p className="upload-filename">{file?.name}</p>
            </>
          ) : (
            <>
              <div className="upload-icon">
                <UploadCloud size={32} />
              </div>
              <h3>Drag &amp; drop, or click to upload</h3>
              <p>JPG, PNG, HEIC up to 10MB</p>
            </>
          )}
          <input
            ref={fileInput}
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
        </div>

        <div className="card upload-text">
          <h3>
            <Sparkles size={16} /> Or paste prescription text
          </h3>
          <textarea
            className="textarea"
            placeholder="Type or paste your prescription here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="btn btn-primary btn-lg"
            disabled={loading}
            onClick={handleAnalyze}
          >
            <ScanLine size={16} />{" "}
            {loading ? "Analyzing..." : "Analyze prescription"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="card analysis-card">
          <div className="skeleton" style={{ height: 24, width: "40%" }} />
          <div
            className="skeleton"
            style={{ height: 16, width: "100%", marginTop: 12 }}
          />
          <div
            className="skeleton"
            style={{ height: 16, width: "82%", marginTop: 8 }}
          />
        </div>
      )}

      {result && (
        <div className="card analysis-card">
          <h2 className="section-title">Analysis</h2>
          <div className="analysis-section">
            <h4>Extracted text</h4>
            <pre className="extracted">{result.extracted || "(empty)"}</pre>
          </div>

          <div className="analysis-section">
            <h4>Identified medicines</h4>
            {result.items?.length > 0 ? (
              <EditableMedicineTable
                items={result.items}
                onChange={updateItem}
                onRemove={removeItem}
                onAdd={addItem}
                onAddAll={() => setShowPrompt(true)}
                adding={adding}
                total={itemsTotal(result.items)}
              />
            ) : (
              <ReactMarkdown>{result.validated || "_None_"}</ReactMarkdown>
            )}
          </div>

          <div className="analysis-section">
            <h4>Medicine details</h4>
            {Object.keys(result.details).length === 0 ? (
              <p className="muted">No medicine info found.</p>
            ) : (
              <div className="med-info-list">
                {Object.entries(result.details).map(([name, desc]) => (
                  <div className="med-info" key={name}>
                    <h5>{name}</h5>
                    <ReactMarkdown>{desc}</ReactMarkdown>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showPrompt && result?.items?.length > 0 && (
        <CartPromptModal
          items={result.items}
          total={itemsTotal(result.items)}
          adding={adding}
          onYes={() => addItemsNow(result.items)}
          onNo={() => setShowPrompt(false)}
        />
      )}
    </div>
  );
};

// Ensure each item has the right shape and types.
const normalizeItems = (items) =>
  (items || [])
    .map((it) => ({
      name: String(it?.name || "").trim(),
      quantity: Math.max(1, parseInt(it?.quantity, 10) || 1),
      price: Math.max(0, Number(it?.price) || 0),
    }))
    .filter((it) => it.name);

const EditableMedicineTable = ({
  items,
  onChange,
  onRemove,
  onAdd,
  onAddAll,
  adding,
  total,
}) => (
  <div className="rx-items">
    <div className="rx-items-head">
      <span className="rx-items-title">
        Edit details before adding to cart
      </span>
      <button className="btn btn-ghost btn-sm" onClick={onAdd}>
        <Plus size={14} /> Add row
      </button>
    </div>
    <div className="rx-table-wrap">
      <table className="rx-table">
        <thead>
          <tr>
            <th>Medicine</th>
            <th style={{ width: 110 }}>Quantity</th>
            <th style={{ width: 130 }}>Price (₹)</th>
            <th style={{ width: 110 }} className="num">
              Subtotal
            </th>
            <th style={{ width: 44 }} aria-label="Remove" />
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const price = Number(it.price) || 0;
            const qty = Number(it.quantity) || 1;
            return (
              <tr key={i}>
                <td>
                  <input
                    className="rx-input"
                    type="text"
                    value={it.name}
                    placeholder="Medicine name"
                    onChange={(e) => onChange(i, "name", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="rx-input num"
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) =>
                      onChange(i, "quantity", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    className="rx-input num"
                    type="number"
                    min={0}
                    step="0.01"
                    value={price}
                    onChange={(e) =>
                      onChange(i, "price", e.target.value)
                    }
                  />
                </td>
                <td className="num">
                  {price > 0 ? `₹${(price * qty).toFixed(2)}` : "—"}
                </td>
                <td>
                  <button
                    className="rx-row-remove"
                    title="Remove row"
                    onClick={() => onRemove(i)}
                    aria-label="Remove row"
                  >
                    <X size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="muted" style={{ textAlign: "center" }}>
                No medicines. Click "Add row" to add one manually.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="num">
              <strong>Total (estimated)</strong>
            </td>
            <td className="num">
              <strong>₹{total.toFixed(2)}</strong>
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
    <button
      className="btn btn-primary"
      disabled={adding || items.length === 0}
      onClick={onAddAll}
    >
      <ShoppingCart size={16} />{" "}
      {adding ? "Adding…" : "Add all to cart"}
    </button>
  </div>
);

const CartPromptModal = ({ items, total, adding, onYes, onNo }) => (
  <div
    className="rx-modal-backdrop"
    role="dialog"
    aria-modal="true"
    onClick={onNo}
  >
    <div className="rx-modal" onClick={(e) => e.stopPropagation()}>
      <button
        className="rx-modal-close"
        onClick={onNo}
        aria-label="Close"
      >
        <X size={16} />
      </button>
      <div className="rx-modal-icon">
        <ShoppingCart size={22} />
      </div>
      <h3 className="rx-modal-title">Add medicines to cart?</h3>
      <p className="rx-modal-sub">
        We found <strong>{items.length}</strong> medicine
        {items.length === 1 ? "" : "s"} on your prescription. Do you want to
        add them all to your cart with the quantity and price shown?
      </p>

      <div className="rx-modal-table-wrap">
        <table className="rx-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th style={{ width: 70 }} className="num">
                Qty
              </th>
              <th style={{ width: 90 }} className="num">
                Price
              </th>
              <th style={{ width: 100 }} className="num">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const price = Number(it.price) || 0;
              const qty = Number(it.quantity) || 1;
              return (
                <tr key={i}>
                  <td>{it.name}</td>
                  <td className="num">{qty}</td>
                  <td className="num">
                    {price > 0 ? `₹${price.toFixed(2)}` : "—"}
                  </td>
                  <td className="num">
                    {price > 0 ? `₹${(price * qty).toFixed(2)}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="num">
                <strong>Total</strong>
              </td>
              <td className="num">
                <strong>₹{total.toFixed(2)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="rx-modal-actions">
        <button
          className="btn btn-ghost"
          onClick={onNo}
          disabled={adding}
        >
          No
        </button>
        <button
          className="btn btn-primary"
          onClick={onYes}
          disabled={adding}
        >
          <Check size={16} /> {adding ? "Adding…" : "Yes, add all"}
        </button>
      </div>
    </div>
  </div>
);

export default UploadPrescription;
