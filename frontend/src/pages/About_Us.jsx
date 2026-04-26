import { Link } from "react-router-dom";
import {
  Sparkles,
  Stethoscope,
  Bot,
  Pill,
  CalendarDays,
  ShieldCheck,
  Boxes,
  ArrowRight,
} from "lucide-react";
import "./aboutus.css";

const FEATURES = [
  { icon: Bot, title: "TTS-friendly chatbot", text: "PharmaBot answers in clean, accessible language." },
  { icon: Pill, title: "Side-effect intelligence", text: "Pulled live from Gemini, written in plain words." },
  { icon: Sparkles, title: "Handwriting + QR Rx", text: "OCR + AI converts both into structured data." },
  { icon: ShieldCheck, title: "Valid prescription check", text: "Quickly flags missing or unsafe info." },
  { icon: Boxes, title: "Inventory & ordering", text: "Order in one tap, track availability live." },
  { icon: Stethoscope, title: "Doctor queue", text: "Book and prebook appointments without friction." },
  { icon: CalendarDays, title: "Med scheduler", text: "Reminders that actually fit your day." },
];

const AboutUs = () => {
  return (
    <div className="page">
      <div className="about-hero card">
        <div>
          <span className="badge"><Sparkles size={12} /> Why PharmaHub</span>
          <h1 className="page-title" style={{ marginTop: 8 }}>
            Reshaping healthcare, <span className="gradient-text">one tap at a time</span>
          </h1>
          <p className="page-subtitle" style={{ maxWidth: 640 }}>
            We blend AI, beautiful design, and clinical clarity to give you a
            calmer, smarter medical experience — for patients and practitioners
            alike.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Link to="/uploadprescription" className="btn btn-primary">
              Try it now <ArrowRight size={16} />
            </Link>
            <Link to="/chatbot" className="btn btn-secondary">
              Talk to PharmaBot
            </Link>
          </div>
        </div>
        <img src="/hero-image.svg" alt="" className="about-art" />
      </div>

      <h2 className="page-title" style={{ marginTop: 48 }}>
        What's inside
      </h2>
      <p className="page-subtitle">A complete toolbox for modern pharmacy.</p>

      <div className="about-grid">
        {FEATURES.map((f, i) => (
          <div className="card card-hover about-feature" key={i}>
            <div className="tile-icon tinted-brand">
              <f.icon size={20} />
            </div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutUs;
