import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Sparkles, ArrowRight } from "lucide-react";
import { api } from "../utils/api";
import { setSession } from "../utils/auth";
import { useToast } from "../components/Toast";
import "./auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setSession({ token: data.token, userId: data.userId, user: data.user });
      toast.success("Welcome back!");
      navigate("/home");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed");
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
          <span className="badge"><Sparkles size={12} /> AI-powered care</span>
          <h2>Your prescriptions, decoded.</h2>
          <p>
            Login to upload prescriptions, schedule appointments, and chat with
            PharmaBot — all in one beautifully simple place.
          </p>
          <ul className="auth-list">
            <li>OCR + Gemini AI prescription analysis</li>
            <li>Real-time medicine info & side-effects</li>
            <li>One-tap pharmacy ordering</li>
          </ul>
        </div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-card">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to your PharmaHub account</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">Email</label>
              <div className="input-icon">
                <Mail size={16} />
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Password</label>
              <div className="input-icon">
                <Lock size={16} />
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              className="btn btn-primary btn-block btn-lg"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="auth-footer">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
