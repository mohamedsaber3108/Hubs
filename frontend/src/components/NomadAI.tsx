import { useState, useRef, useEffect } from "react";
import { Bot, X, Minimize2, Maximize2, Send, Trash2, Sparkles, Loader2 } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import { nomadService, type NomadMessage } from "@/services/nomad.service";
import { useAuth } from "@/contexts/AuthContext";

interface Message { id: string; role: "user" | "assistant"; content: string; }

const QUICK_ACTIONS = [
  { emoji: "🔥", text: "What's trending in my communities?" },
  { emoji: "📅", text: "Events happening this week" },
  { emoji: "💼", text: "Opportunities matching my skills" },
  { emoji: "🏆", text: "Active challenges I can join" },
  { emoji: "📚", text: "Resources for my skill area" },
];

const CONTEXT_HINTS: Record<string, string> = {
  "/events":       "Looking for events? Ask me for recommendations!",
  "/opportunities":"Describe your ideal role and I'll help find matches!",
  "/challenges":   "Not sure which challenge to join? Tell me your skills!",
  "/profile":      "Want tips to improve your profile? Ask me!",
  "/leaderboard":  "Want to climb the ranks? I can suggest activities!",
};

function getContextHint(pathname: string): string | null {
  for (const [key, hint] of Object.entries(CONTEXT_HINTS)) {
    if (pathname.includes(key)) return hint;
  }
  return null;
}

export default function NomadAI() {
  const [open, setOpen]           = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const location                  = useLocation();
  const { community }             = useParams<{ community?: string }>();
  const { isLoggedIn }            = useAuth();
  const contextHint               = getContextHint(location.pathname);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || !isLoggedIn) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history: NomadMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));
      const reply = await nomadService.chat(text, history, community);
      setMessages((prev) => [...prev, { id: Date.now().toString() + '_ai', role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: Date.now().toString() + '_err', role: "assistant", content: "Sorry, I'm having trouble right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <>
      {/* FAB */}
      <button onClick={() => setOpen(true)}
        className={`fixed bottom-20 end-4 z-40 w-14 h-14 rounded-full bg-primary-glow shadow-lg flex items-center justify-center transition-all hover:scale-110 ${open ? "scale-0 opacity-0 pointer-events-none" : ""}`}>
        <Bot className="w-7 h-7 text-primary-foreground" />
        <span className="absolute -top-0.5 -end-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-background" />
      </button>

      {/* Chat window */}
      {open && (
        <div className={`fixed bottom-20 end-4 z-50 flex flex-col rounded-2xl border border-border bg-background shadow-2xl transition-all ${minimized ? "h-14 w-72 overflow-hidden" : "w-80 sm:w-96 h-[520px]"}`}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card rounded-t-2xl flex-shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-primary-glow/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-glow" />
              </div>
              <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm flex items-center gap-1">NomadAI <Sparkles className="w-3 h-3 text-yellow-400" /></p>
              <p className="text-xs text-muted-foreground truncate">{contextHint || "Your AI career assistant"}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMessages([])} title="Clear" className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setMinimized(!minimized)} className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                {minimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
                {messages.length === 0 && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-glow/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-4 h-4 text-primary-glow" />
                      </div>
                      <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2.5 text-foreground max-w-[80%]">
                        مرحباً! I'm NomadAI 👋 Ask me anything about careers, freelancing, or the USAM Hub community.
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Quick actions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_ACTIONS.map((q) => (
                        <button key={q.text} onClick={() => sendMessage(q.text)}
                          className="text-xs px-2.5 py-1.5 rounded-full border border-border bg-card hover:border-primary-glow/30 text-muted-foreground hover:text-foreground transition-all">
                          {q.emoji} {q.text.split(" ").slice(0, 3).join(" ")}…
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    {m.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-primary-glow/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-4 h-4 text-primary-glow" />
                      </div>
                    )}
                    <div className={`rounded-2xl px-3 py-2.5 max-w-[80%] ${m.role === "user" ? "bg-primary-glow text-primary-foreground rounded-tr-sm" : "bg-secondary text-foreground rounded-tl-sm"}`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary-glow/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-primary-glow" />
                    </div>
                    <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
                    placeholder="Ask NomadAI…"
                    className="flex-1 px-3 py-2 text-sm bg-secondary rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary-glow/30 text-foreground placeholder:text-muted-foreground"
                  />
                  <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                    className="w-9 h-9 rounded-lg bg-primary-glow text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:bg-primary-glow/90 transition-colors flex-shrink-0">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
