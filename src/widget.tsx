import React, { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { createRoot } from "react-dom/client";
import { RotateCw, X, ArrowUp, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

// ── Config (read from window.MarnoChatConfig or global defaults) ───────

declare global {
  interface Window {
    MarnoChatConfig?: MarnoConfig;
    __marnoWidgetMount?: HTMLDivElement;
  }
}

interface MarnoConfig {
  webhookUrl?: string;
  kbSlug?: string;
  brandName?: string;
  brandLogo?: string;
  primaryColor?: string;
  suggestions?: { label: string; prompt: string }[];
  greetings?: [string, string];
  poweredBy?: string;
  poweredByUrl?: string;
  subtitle?: string;
}

const cfg: Required<MarnoConfig> = {
  webhookUrl: window.MarnoChatConfig?.webhookUrl || "https://n8n.marno.pro/webhook/marno-chat",
  kbSlug: window.MarnoChatConfig?.kbSlug || "kbase",
  brandName: window.MarnoChatConfig?.brandName || "Marno AI",
  brandLogo: window.MarnoChatConfig?.brandLogo || "",
  primaryColor: window.MarnoChatConfig?.primaryColor || "#0D72FF",
  suggestions: window.MarnoChatConfig?.suggestions || [
    { label: "Get started", prompt: "How do I get started with the platform?" },
    { label: "See templates", prompt: "Can you show me the available templates?" },
    { label: "Pricing", prompt: "What are the pricing plans available?" },
    { label: "Book a demo", prompt: "I would like to book a demo." },
    { label: "Documentation", prompt: "Where can I find the API documentation?" },
  ],
  greetings: window.MarnoChatConfig?.greetings || [
    "Hi there! I'm an AI agent trained on docs, help articles, and other important content.",
    "How can I best help you today?",
  ],
  poweredBy: window.MarnoChatConfig?.poweredBy || "Powered by Marno AI",
  poweredByUrl: window.MarnoChatConfig?.poweredByUrl || "https://marno.ai",
  subtitle: window.MarnoChatConfig?.subtitle || "",
};

// ── Cached fetch interceptor (for demo/fallback) ──────────────────────

if (!window.MarnoChatConfig?.webhookUrl) {
  const origFetch = window.fetch.bind(window);
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    try {
      const body = JSON.parse(init?.body as string || "{}");
      const query: string = (Array.isArray(body) ? body[0]?.chatInput : body?.chatInput) || "";
      if (query) {
        const fakeOutput = "This is a demo response. Set `webhookUrl` in your config to connect to a real n8n workflow.";
        const resp = new Response(JSON.stringify({ response: fakeOutput }), { status: 200, headers: { "Content-Type": "application/json" } });
        return Promise.resolve(resp);
      }
    } catch { /* pass */ }
    return origFetch(input, init);
  };
}

// ── Types ──────────────────────────────────────────────────────────────

type Message = { id: string; role: "user" | "model" | "system"; text: string };

// ── Styles (injected) ──────────────────────────────────────────────────

const STYLES = `
.marno-chat-toggle {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2147483646;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  transition: transform 0.2s, box-shadow 0.2s;
  padding: 0;
  background: transparent;
}
.marno-chat-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(0,0,0,0.3);
}
.marno-chat-toggle:active {
  transform: scale(0.95);
}
.marno-chat-toggle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.marno-chat-container {
  position: fixed;
  bottom: 84px;
  right: 24px;
  z-index: 2147483647;
  width: 400px;
  height: 640px;
  max-height: calc(100vh - 120px);
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 12px 48px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 15px;
  color: #1e1e1e;
}

.marno-chat-header {
  background: ${cfg.primaryColor};
  color: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.marno-chat-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.marno-chat-header-logo {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #2A2E35;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.marno-chat-header-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.marno-chat-header-name {
  font-weight: 600;
  font-size: 15px;
}
.marno-chat-header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}
.marno-chat-header-actions button {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  opacity: 0.8;
  transition: opacity 0.15s;
}
.marno-chat-header-actions button:hover {
  opacity: 1;
}

.marno-chat-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.marno-chat-messages::-webkit-scrollbar { display: none; }
.marno-chat-messages { scrollbar-width: none; }

.marno-chat-subtitle {
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
  margin-bottom: 8px;
}

.marno-chat-bubble {
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  max-width: 85%;
  word-wrap: break-word;
}
.marno-chat-bubble-user {
  background: ${cfg.primaryColor};
  color: #fff;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}
.marno-chat-bubble-bot {
  background: #f3f4f6;
  color: #1e1e1e;
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}
.marno-chat-bubble p { margin: 0; }
.marno-chat-bubble p + p { margin-top: 8px; }
.marno-chat-bubble ul, .marno-chat-bubble ol { margin: 4px 0; padding-left: 20px; }
.marno-chat-bubble strong { font-weight: 600; }

.marno-chat-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f3f4f6;
  border-radius: 12px;
  border-bottom-left-radius: 4px;
  align-self: flex-start;
  font-size: 14px;
  color: #9ca3af;
}
@keyframes marno-spin { to { transform: rotate(360deg); } }
.marno-chat-loading svg { animation: marno-spin 1s linear infinite; }

.marno-chat-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.marno-chat-suggestion {
  background: #eff6ff;
  color: ${cfg.primaryColor};
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
  font-family: inherit;
}
.marno-chat-suggestion:hover {
  background: #dbeafe;
}

.marno-chat-input-wrap {
  padding: 12px 16px 16px;
  background: linear-gradient(to top, #fff 80%, transparent);
  position: relative;
}
.marno-chat-input-bar {
  display: flex;
  align-items: center;
  border: 2px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
  padding-left: 16px;
}
.marno-chat-input-bar:focus-within {
  border-color: ${cfg.primaryColor};
}
.marno-chat-input-bar input {
  flex: 1;
  border: none;
  outline: none;
  padding: 10px 0;
  font-size: 14px;
  font-family: inherit;
  background: transparent;
  color: #1e1e1e;
}
.marno-chat-input-bar input::placeholder { color: #9ca3af; }
.marno-chat-input-bar input:disabled { opacity: 0.6; }

.marno-chat-send-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}
.marno-chat-send-btn-active {
  background: ${cfg.primaryColor};
  color: #fff;
}
.marno-chat-send-btn-disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.marno-chat-footer {
  text-align: center;
  padding: 7px;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;
}
.marno-chat-footer a {
  color: ${cfg.primaryColor};
  text-decoration: none;
  font-size: 12px;
  opacity: 0.7;
}
.marno-chat-footer a:hover { opacity: 1; }

@media (max-width: 480px) {
  .marno-chat-container {
    width: calc(100vw - 16px);
    right: 8px;
    bottom: 80px;
    height: calc(100vh - 120px);
  }
  .marno-chat-toggle {
    right: 12px;
    bottom: 20px;
  }
}
`;

// ── Default avatar SVG (when no logo provided) ─────────────────────────

const DEFAULT_AVATAR = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="transform:translateY(1px)"><path d="M4 17V10A4 4 0 0 1 12 10V17M12 17V10A4 4 0 0 1 20 10V17"/></svg>`;

// ── Widget Component ───────────────────────────────────────────────────

function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    { id: crypto.randomUUID(), role: "system", text: cfg.greetings[0] },
    { id: crypto.randomUUID(), role: "system", text: cfg.greetings[1] },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionIdRef.current = crypto.randomUUID();
  }, []);

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride || inputValue).trim();
    if (!text) return;
    if (!textOverride) setInputValue("");

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch(cfg.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, sessionId: sessionIdRef.current, slug: cfg.kbSlug }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const responseText: string = data.response || "";

      const modelId = crypto.randomUUID();
      setIsLoading(false);
      setMessages(prev => [...prev, { id: modelId, role: "model", text: "" }]);

      const chars = responseText.split("");
      let fullText = "";
      for (let i = 0; i < chars.length; i += 2) {
        fullText += chars[i] + (chars[i + 1] || "");
        setMessages(prev =>
          prev.map(m => (m.id === modelId ? { ...m, text: fullText } : m))
        );
        await new Promise(r => setTimeout(r, 10));
      }
    } catch (err) {
      console.error("[MarnoWidget] send error:", err);
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: "model", text: "Sorry, I ran into an error. Please try again." },
      ]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  const reset = () => {
    setMessages([
      { id: crypto.randomUUID(), role: "system", text: cfg.greetings[0] },
      { id: crypto.randomUUID(), role: "system", text: cfg.greetings[1] },
    ]);
    setInputValue("");
    sessionIdRef.current = crypto.randomUUID();
  };

  const isInputEmpty = !inputValue.trim();

  return (
    <>
      <style>{STYLES}</style>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="widget-panel"
            className="marno-chat-container"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="marno-chat-header">
              <div className="marno-chat-header-left">
                <div className="marno-chat-header-logo">
                  {cfg.brandLogo ? (
                    <img src={cfg.brandLogo} alt={cfg.brandName} />
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: DEFAULT_AVATAR }} />
                  )}
                </div>
                <span className="marno-chat-header-name">{cfg.brandName}</span>
              </div>
              <div className="marno-chat-header-actions">
                <button onClick={reset} title="Reset chat">
                  <RotateCw size={16} strokeWidth={2.5} />
                </button>
                <button onClick={() => setIsOpen(false)} title="Close">
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="marno-chat-messages">
              {cfg.subtitle && (
                <p className="marno-chat-subtitle">{cfg.subtitle}</p>
              )}
              <AnimatePresence mode="popLayout" initial={true}>
                {messages.map(msg => {
                  const isUser = msg.role === "user";
                  const isBot = msg.role === "model" || msg.role === "system";
                  const parts = isUser
                    ? [msg.text]
                    : msg.text.split(/(?:\r?\n){2,}/).filter(t => t.trim().length > 0);
                  if (parts.length === 0 && isBot) parts.push("");

                  return (
                    <React.Fragment key={msg.id}>
                      {parts.map((part, i) => (
                        <motion.div
                          key={`${msg.id}-${i}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`marno-chat-bubble ${isUser ? "marno-chat-bubble-user" : "marno-chat-bubble-bot"}`}
                        >
                          {isBot ? (
                            <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                              {part || " "}
                            </ReactMarkdown>
                          ) : (
                            part
                          )}
                        </motion.div>
                      ))}
                    </React.Fragment>
                  );
                })}
                {isLoading && (
                  <motion.div
                    key="marno-loading"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="marno-chat-loading"
                  >
                    <Loader2 size={14} />
                    <span>Thinking…</span>
                  </motion.div>
                )}
                {!isLoading &&
                  messages.length === 2 &&
                  messages[0].role === "system" && (
                    <motion.div
                      key="marno-suggestions"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="marno-chat-suggestions"
                    >
                      {cfg.suggestions.map(s => (
                        <button
                          key={s.prompt}
                          className="marno-chat-suggestion"
                          onClick={() => sendMessage(s.prompt)}
                        >
                          {s.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="marno-chat-input-wrap">
              <div className="marno-chat-input-bar">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message…"
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={isInputEmpty || isLoading}
                  className={`marno-chat-send-btn ${isInputEmpty || isLoading ? "marno-chat-send-btn-disabled" : "marno-chat-send-btn-active"}`}
                >
                  <ArrowUp size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="marno-chat-footer">
              <a href={cfg.poweredByUrl} target="_blank" rel="noopener noreferrer">
                {cfg.poweredBy}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button
        className="marno-chat-toggle"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Open chat"
      >
        <img
          src={cfg.brandLogo || "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg"}
          alt="Chat"
        />
      </button>
    </>
  );
}

// ── Bootstrap ──────────────────────────────────────────────────────────

function mount() {
  if (document.getElementById("marno-widget-root")) return;
  const root = document.createElement("div");
  root.id = "marno-widget-root";
  document.body.appendChild(root);
  createRoot(root).render(React.createElement(ChatWidget));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
