import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Phone, Sparkles, ArrowRight } from "lucide-react";
import { api } from "../utils/api";
import { setSession } from "../utils/auth";
import { useToast } from "../components/Toast";
import "./auth.css";

const Signup = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      setSession({ token: data.token, userId: data.userId, user: data.user });
      toast.success("Account created!");
      navigate("/home");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-art">
        <Link to="/" className="auth-logo">
          <span className="auth-logo-mark">P+</span>
          <span>PharmaHub</span>
        </Link>
        <div className="auth-art-content">
          <span className="badge"><Sparkles size={12} /> Join PharmaHub</span>
          <h2>Smarter healthcare, one tap away.</h2>
          <p>
            Create your account in 30 seconds and never decode a doctor's
            handwriting again.
          </p>
          <ul className="auth-list">
            <li>Free to start, no credit card required</li>
            <li>Secure, encrypted, privacy-first</li>
            <li>Designed for patients and clinicians</li>
          </ul>
        </div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-card">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Start your AI-pharmacy journey</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="field">
                <label className="label">First name</label>
                <div className="input-icon">
                  <User size={16} />
                  <input
                    type="text"
                    className="input"
                    placeholder="Jane"
                    value={form.firstName}
                    onChange={update("firstName")}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">Last name</label>
                <div className="input-icon">
                  <User size={16} />
                  <input
                    type="text"
                    className="input"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={update("lastName")}
                  />
                </div>
              </div>
            </div>

            <div className="field">
              <label className="label">Email</label>
              <div className="input-icon">
                <Mail size={16} />
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={update("email")}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Phone</label>
              <div className="input-icon">
                <Phone size={16} />
                <input
                  type="tel"
                  className="input"
                  placeholder="10-digit number"
                  value={form.phone}
                  onChange={update("phone")}
                  required
                  pattern="[0-9]{10}"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="label">Password</label>
                <div className="input-icon">
                  <Lock size={16} />
                  <input
                    type="password"
                    className="input"
                    placeholder="At least 6 chars"
                    value={form.password}
                    onChange={update("password")}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">Confirm</label>
                <div className="input-icon">
                  <Lock size={16} />
                  <input
                    type="password"
                    className="input"
                    placeholder="Repeat password"
                    value={form.confirmPassword}
                    onChange={update("confirmPassword")}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create account"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
