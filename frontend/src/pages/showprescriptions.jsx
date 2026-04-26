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
} from "lucide-react";
import { api } from "../utils/api";
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
