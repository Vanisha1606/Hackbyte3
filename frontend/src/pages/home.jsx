import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Pill,
  Bot,
  CalendarDays,
  ScanLine,
  ShieldCheck,
  Activity,
  Stethoscope,
  ArrowRight,
  Zap,
} from "lucide-react";
import { isAuthed, getStoredUser } from "../utils/auth";
import "./home.css";

const features = [
  {
    icon: ScanLine,
    title: "Decode handwritten Rx",
    text: "OCR + Gemini AI turns scribbles into a clean, structured medication plan.",
    accent: "violet",
  },
  {
    icon: Pill,
    title: "Medicine intelligence",
    text: "Usage, dosage, and side-effects pulled in real time, in plain language.",
    accent: "teal",
  },
  {
    icon: Bot,
    title: "PharmaBot 24/7",
    text: "Ask anything – from drug interactions to lifestyle tips – and get instant answers.",
    accent: "brand",
  },
  {
    icon: CalendarDays,
    title: "Doctor scheduling",
    text: "View timetables and pre-book appointments without the phone tag.",
    accent: "amber",
  },
];

const steps = [
  {
    title: "Upload prescription",
    text: "Snap a photo or pick a file – any common format works.",
    icon: ScanLine,
  },
  {
    title: "AI processes it",
    text: "We extract medicines, dosages, and timings with high accuracy.",
    icon: Sparkles,
  },
  {
    title: "Order or schedule",
    text: "Add to cart in one tap, or schedule appointments with the right doctor.",
    icon: Zap,
  },
];

const Home = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const greet = isAuthed()
    ? `Welcome back, ${user?.firstName || "friend"} 👋`
    : "Welcome to PharmaHub";

  return (
    <div className="page">
      <section className="hero card-hover">
        <div className="hero-bg" aria-hidden />
        <div className="hero-content">
          <span className="badge"><Sparkles size={12} /> AI-Powered Pharmacy</span>
          <h1 className="hero-title">
            <span className="gradient-text">{greet}</span>
          </h1>
          <p className="hero-sub">
            PharmaHub is your one-stop platform for prescriptions, doctor
            appointments, medicine ordering, and instant medical answers — all
            wrapped in a beautifully simple experience.
          </p>
          <div className="hero-cta">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate("/uploadprescription")}
            >
              <ScanLine size={18} /> Try Prescription AI
            </button>
            <Link to="/shop" className="btn btn-secondary btn-lg">
              Browse Pharmacy <ArrowRight size={16} />
            </Link>
          </div>

          <div className="hero-stats">
            <div>
              <strong>10k+</strong>
              <span>Prescriptions decoded</span>
            </div>
            <div>
              <strong>98%</strong>
              <span>Avg. extraction accuracy</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>PharmaBot availability</span>
            </div>
          </div>
        </div>

        <div className="hero-art">
          <img src="/hero-image.svg" alt="Prescription scanning" />
          <div className="hero-floating card glass">
            <ShieldCheck size={20} className="hero-floating-icon" />
            <div>
              <strong>HIPAA-ready</strong>
              <small>End-to-end encrypted</small>
            </div>
          </div>
          <div className="hero-floating hero-floating-2 card glass">
            <Activity size={20} className="hero-floating-icon" />
            <div>
              <strong>Real-time AI</strong>
              <small>Powered by Gemini</small>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="row-between">
          <div>
            <h2 className="page-title">Everything you need, in one app</h2>
            <p className="page-subtitle">
              From prescription chaos to perfect clarity in seconds.
            </p>
          </div>
          <Link to="/aboutus" className="btn btn-ghost">
            Learn more <ArrowRight size={14} />
          </Link>
        </div>

        <div className="section-grid grid-4" style={{ marginTop: 20 }}>
          {features.map((f, i) => (
            <div className="card card-hover feature-tile" key={i}>
              <div className={`tile-icon tinted-${f.accent}`}>
                <f.icon size={20} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block">
        <h2 className="page-title">How it works</h2>
        <p className="page-subtitle">Three steps. Real medical clarity.</p>

        <div className="steps section-grid grid-3">
          {steps.map((s, i) => (
            <div className="card step-card" key={i}>
              <div className="step-num">{i + 1}</div>
              <div className="step-icon">
                <s.icon size={22} />
              </div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="cta-banner">
          <div>
            <h2>Ready to take control of your meds?</h2>
            <p>Upload your first prescription and see PharmaHub in action.</p>
          </div>
          <div className="cta-actions">
            <Link to="/uploadprescription" className="btn btn-primary btn-lg">
              <Stethoscope size={18} /> Get started
            </Link>
            <Link to="/chatbot" className="btn btn-secondary btn-lg">
              Chat with PharmaBot
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
