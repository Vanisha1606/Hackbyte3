import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  User,
  PencilLine,
  Upload,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { api } from "../utils/api";
import { getStoredUser, getUserId, getToken } from "../utils/auth";
import { useToast } from "../components/Toast";
import "./profilepage.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    const userId = getUserId();
    if (!userId || !getToken()) {
      navigate("/login");
      return;
    }
    api
      .get(`/users/${userId}`)
      .then((r) => {
        setUser(r.data);
        localStorage.setItem("user", JSON.stringify(r.data));
      })
      .catch((e) => {
        if (!user)
          toast.error(
            e?.response?.data?.message || "Failed to load profile"
          );
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !user)
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 240, borderRadius: 20 }} />
      </div>
    );

  if (!user)
    return (
      <div className="page">
        <div className="empty-state">
          <h3>You're not signed in</h3>
          <p>Please sign in to view your profile.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            onClick={() => navigate("/login")}
          >
            Sign in
          </button>
        </div>
      </div>
    );

  const initial =
    user.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="page">
      <div className="profile-grid">
        <div className="card profile-hero">
          <div className="profile-id">
            <div className="profile-avatar">{initial}</div>
            <div className="profile-meta">
              <h1>
                {user.firstName} {user.lastName}
              </h1>
              <p>@{user.email?.split("@")[0]}</p>
              <span className="badge">
                <ShieldCheck size={12} /> Verified
              </span>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/editprofile")}
            >
              <PencilLine size={16} /> Edit profile
            </button>
          </div>

          <div className="profile-info-grid">
            <div className="info-row">
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
            <div className="info-row">
              <Phone size={16} />
              <span>{user.phone || "—"}</span>
            </div>
            <div className="info-row">
              <User size={16} />
              <span>{user.gender || "Not specified"}</span>
            </div>
          </div>
        </div>

        <div className="card profile-actions">
          <h2 className="section-title">Quick actions</h2>
          <button
            className="btn btn-secondary action"
            onClick={() => navigate("/uploadprescription")}
          >
            <Upload size={16} /> Upload Prescription
          </button>
          <button
            className="btn btn-secondary action"
            onClick={() => navigate("/showprescriptions")}
          >
            <ScrollText size={16} /> My Prescriptions
          </button>
          <button
            className="btn btn-secondary action"
            onClick={() => navigate("/appointment")}
          >
            <PencilLine size={16} /> Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
