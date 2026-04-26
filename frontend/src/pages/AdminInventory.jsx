import { useEffect, useState } from "react";
import { PackagePlus, Save, Boxes } from "lucide-react";
import { api } from "../utils/api";
import { useToast } from "../components/Toast";
import "./admininventory.css";

const empty = {
  med_name: "",
  med_desc: "",
  side_effects: "",
  med_price: "",
  med_quantity: "",
};

const AdminInventory = () => {
  const toast = useToast();
  const [form, setForm] = useState(empty);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      const r = await api.get("/api/medicines");
      setList(r.data || []);
    } catch (e) {
      toast.error("Could not load inventory");
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/medicines", {
        ...form,
        med_price: Number(form.med_price) || 0,
        med_quantity: Number(form.med_quantity) || 0,
      });
      toast.success("Medicine added!");
      setForm(empty);
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to add medicine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pharmacy inventory</h1>
          <p className="page-subtitle">Add new SKUs and review current stock.</p>
        </div>
        <span className="badge">
          <Boxes size={12} /> {list.length} items in stock
        </span>
      </div>

      <div className="inv-grid">
        <form className="card inv-form" onSubmit={handleSubmit}>
          <h2 className="section-title">
            <PackagePlus size={18} /> Add medicine
          </h2>

          <div className="field">
            <label className="label">Medicine name</label>
            <input
              className="input"
              name="med_name"
              value={form.med_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label className="label">Description</label>
            <input
              className="input"
              name="med_desc"
              value={form.med_desc}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label className="label">Side effects</label>
            <input
              className="input"
              name="side_effects"
              value={form.side_effects}
              onChange={handleChange}
            />
          </div>

          <div className="grid-2-cols">
            <div className="field">
              <label className="label">Price (₹)</label>
              <input
                className="input"
                type="number"
                name="med_price"
                value={form.med_price}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field">
              <label className="label">Quantity</label>
              <input
                className="input"
                type="number"
                name="med_quantity"
                value={form.med_quantity}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            <Save size={16} /> {loading ? "Adding..." : "Add to inventory"}
          </button>
        </form>

        <div className="card inv-list">
          <h2 className="section-title">Current inventory</h2>
          {list.length === 0 ? (
            <p className="muted">No items yet. Add one to get started.</p>
          ) : (
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
                  <tr key={m._id || m.med_name}>
                    <td>
                      <strong>{m.med_name}</strong>
                      <br />
                      <small className="muted">{m.med_desc}</small>
                    </td>
                    <td>₹{m.med_price}</td>
                    <td>
                      {m.med_quantity > 0 ? (
                        <span className="badge badge-success">{m.med_quantity}</span>
                      ) : (
                        <span className="badge badge-danger">Sold out</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInventory;
