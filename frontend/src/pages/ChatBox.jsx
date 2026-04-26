import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Image as ImageIcon, Bot, User2, Sparkles } from "lucide-react";
import { aiApi } from "../utils/api";
import { useToast } from "../components/Toast";
import "./chatbox.css";

const SUGGESTIONS = [
  "What's the difference between Paracetamol and Ibuprofen?",
  "Can I take Cetirizine with Pantoprazole?",
  "What are common side effects of Amoxicillin?",
];

const ChatBox = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text:
        "👋 Hi! I'm **PharmaBot**, your AI medical assistant. Ask me about medicines, symptoms, side effects, or upload a prescription image.",
    },
  ]);
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const scrollRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async (overrideText) => {
    const t = (overrideText ?? input).trim();
    if (!t) return;
    setMessages((m) => [...m, { sender: "user", text: t }]);
    setInput("");
    setBusy(true);
    try {
      const r = await aiApi.post("/chat", { user_input: t });
      setMessages((m) => [...m, { sender: "bot", text: r.data?.reply || "(no reply)" }]);
    } catch (e) {
      toast.error(
        "PharmaBot is offline. Make sure FastAPI is running on :8001"
      );
    } finally {
      setBusy(false);
    }
  };

  const sendImage = async () => {
    if (!image) return;
    const fd = new FormData();
    fd.append("file", image);
    setBusy(true);
    setMessages((m) => [
      ...m,
      { sender: "user", text: `🖼️ Uploaded prescription: **${image.name}**` },
    ]);
    try {
      const r1 = await aiApi.post("/extract_text/", fd);
      const extracted = r1.data?.extracted_text || "";
      const r2 = await aiApi.post("/validate_prescription/", { text: extracted });
      const validated = r2.data?.validated || "_No medicines detected_";
      const details = r2.data?.details || {};
      setMessages((m) => [
        ...m,
        { sender: "bot", text: `**Identified medicines:**\n${validated}` },
      ]);
      Object.entries(details).forEach(([name, desc]) => {
        setMessages((m) => [
          ...m,
          { sender: "bot", text: `💊 **${name}**\n\n${desc}` },
        ]);
      });
    } catch (e) {
      toast.error(
        e?.response?.data?.detail ||
          "Image processing failed. Make sure GEMINI_API_KEY is set in fastapi_backend/.env."
      );
    } finally {
      setBusy(false);
      setImage(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">PharmaBot</h1>
          <p className="page-subtitle">Powered by Gemini, tuned for healthcare.</p>
        </div>
        <span className="badge"><Sparkles size={12} /> AI Beta</span>
      </div>

      <div className="card chat-card">
        <div className="chat-stream" ref={scrollRef}>
          {messages.map((msg, i) => (
            <div className={`chat-bubble ${msg.sender}`} key={i}>
              <div className="bubble-icon">
                {msg.sender === "user" ? <User2 size={14} /> : <Bot size={14} />}
              </div>
              <div className="bubble-body">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          {busy && (
            <div className="chat-bubble bot">
              <div className="bubble-icon">
                <Bot size={14} />
              </div>
              <div className="bubble-body typing">
                <span /> <span /> <span />
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="chip"
                onClick={() => sendMessage(s)}
                disabled={busy}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="chat-input-row">
          <button
            className="icon-btn chat-icon"
            onClick={() => fileRef.current?.click()}
            title="Upload prescription image"
            disabled={busy}
          >
            <ImageIcon size={18} />
          </button>
          <input
            type="file"
            accept="image/*"
            hidden
            ref={fileRef}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setImage(f);
            }}
          />
          <input
            className="input chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && sendMessage()}
            placeholder={
              image ? `Ready to send ${image.name}` : "Ask PharmaBot anything..."
            }
            disabled={busy}
          />
          {image ? (
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={sendImage}
            >
              Send image <Send size={16} />
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={busy || !input.trim()}
              onClick={() => sendMessage()}
            >
              Send <Send size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
