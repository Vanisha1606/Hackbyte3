import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";
import { getStoredUser, getUserId, setSession } from "../utils/auth";
import { useToast } from "../components/Toast";
import "./editprofile.css";

const EditProfile = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const stored = getStoredUser();

  const [form, setForm] = useState({
    firstName: stored?.firstName || "",
    lastName: stored?.lastName || "",
    phone: stored?.phone || "",
    email: stored?.email || "",
    gender: stored?.gender || "Prefer not to say",
  });

  useEffect(() => {
    if (!getUserId()) navigate("/login");
  }, [navigate]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const merged = { ...stored, ...form };
    setSession({ user: merged });
    toast.success("Profile updated");
    navigate("/profilepage");
  };

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: 18 }}>
        <div>
          <h1 className="page-title">Edit profile</h1>
          <p className="page-subtitle">Update your personal information</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <form className="card edit-card" onSubmit={handleSubmit}>
        <div className="grid-2-cols">
          <div className="field">
            <label className="label">First name</label>
            <input
              className="input"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field">
            <label className="label">Last name</label>
            <input
              className="input"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid-2-cols">
          <div className="field">
            <label className="label">Phone</label>
            <input
              className="input"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              name="email"
              value={form.email}
              disabled
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Gender</label>
          <select
            className="select"
            name="gender"
            value={form.gender}
            onChange={handleChange}
          >
            <option>Prefer not to say</option>
            <option>Female</option>
            <option>Male</option>
            <option>Non-binary</option>
            <option>Other</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button type="submit" className="btn btn-primary">
            <Save size={16} /> Save changes
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
