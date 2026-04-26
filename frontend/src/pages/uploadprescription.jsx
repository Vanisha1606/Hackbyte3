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
} from "lucide-react";
import { api, aiApi } from "../utils/api";
import { isAuthed } from "../utils/auth";
import { addToCart } from "../utils/cart";
import { useToast } from "../components/Toast";
import "./uploadprescription.css";

// Parse "- Name | qty: N" markdown into [{ name, quantity }] (fallback when
// the AI service didn't return a structured array).
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

const UploadPrescription = () => {
  const fileInput = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [adding, setAdding] = useState(false);
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
          items,
          imageUrl: saved.imageUrl || preview,
          saved: true,
        };
        setResult(next);
        toast.success("Prescription saved to your history.");
        promptAddToCart(items);
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
          items,
          imageUrl: preview,
          saved: false,
        };
        setResult(next);
        toast.success("Prescription analyzed (sign in to save it).");
        promptAddToCart(items);
      }
    } catch (e) {
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.detail ||
          "AI service unavailable. Make sure FastAPI (8000), Node (5000) and Tesseract are running."
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
        const n = (name || "").toLowerCase();
        return catalog.find((m) => {
          const mn = (m.med_name || "").toLowerCase();
          return mn && (mn === n || n.includes(mn) || mn.includes(n));
        });
      };
      let matched = 0;
      let unmatched = 0;
      for (const it of items) {
        const m = findMatch(it.name || "");
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
          ? `Added ${matched + unmatched} item(s). ${unmatched} need price confirmation.`
          : `Added ${matched} item(s) to your cart.`
      );
      navigate("/cart");
    } finally {
      setAdding(false);
    }
  };

  // Auto-prompt right after analysis. Uses a tiny timeout so the result UI
  // renders first before the confirm dialog steals focus.
  const promptAddToCart = (items) => {
    if (!items?.length) return;
    setTimeout(() => {
      const list = items
        .map((i) => `• ${i.name} (x${i.quantity})`)
        .join("\n");
      const ok = window.confirm(
        `We found ${items.length} medicine(s) on your prescription:\n\n${list}\n\nAdd them all to your cart?`
      );
      if (ok) addItemsNow(items);
    }, 250);
  };

  const addExtractedToCart = () => {
    const items = result?.items || [];
    if (!items.length) return;
    if (
      !window.confirm(
        `Add ${items.length} medicine(s) from this prescription to your cart?`
      )
    )
      return;
    addItemsNow(items);
  };

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
            <ReactMarkdown>{result.validated || "_None_"}</ReactMarkdown>
            {result.items?.length > 0 && (
              <div className="rx-items">
                <ul className="rx-items-list">
                  {result.items.map((it, i) => (
                    <li key={i}>
                      <span>{it.name}</span>
                      <span className="rx-qty">x{it.quantity}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className="btn btn-primary"
                  disabled={adding}
                  onClick={addExtractedToCart}
                >
                  <ShoppingCart size={16} />{" "}
                  {adding ? "Adding…" : "Add all to cart"}
                </button>
              </div>
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
    </div>
  );
};

export default UploadPrescription;
