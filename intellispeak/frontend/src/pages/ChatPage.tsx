import { Copy, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import AnalysisChips from "../components/AnalysisChips";
import { api, ApiError } from "../services/api";
import type { Conversation, Message } from "../types";

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(() => api.conversations().then(setConversations).catch(() => {}), []);
  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  async function open(id: number) {
    setError("");
    try {
      const res = await api.conversation(id);
      setActiveId(id); setMessages(res.messages);
    } catch (e) { setError(e instanceof ApiError ? e.message : "Could not open conversation."); }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setText(""); setError(""); setSending(true);
    try {
      const res = await api.sendMessage(value, activeId);
      setActiveId(res.conversation.id);
      setMessages((m) => [...m, res.user_message, res.bot_message]);
      loadList();
    } catch (err) {
      setText(value);
      setError(err instanceof ApiError ? err.message : "Message failed to send.");
    } finally { setSending(false); }
  }

  async function rename(c: Conversation) {
    const title = window.prompt("Rename conversation", c.title)?.trim();
    if (title) { await api.renameConversation(c.id, title); loadList(); }
  }
  async function remove(c: Conversation) {
    if (!window.confirm("Delete this conversation?")) return;
    await api.deleteConversation(c.id);
    if (c.id === activeId) { setActiveId(null); setMessages([]); }
    loadList();
  }

  return (
    <div className="flex h-full">
      <aside className="hidden w-64 flex-col border-r border-ink/10 bg-white/60 p-3 lg:flex">
        <button onClick={() => { setActiveId(null); setMessages([]); }}
          className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-spruce py-2 text-sm font-medium text-mist">
          <Plus size={16} /> New conversation
        </button>
        <ul className="flex-1 space-y-1 overflow-y-auto">
          {conversations.map((c) => (
            <li key={c.id} className={`group flex items-center rounded-lg ${c.id === activeId ? "bg-signal/25" : "hover:bg-ink/5"}`}>
              <button onClick={() => open(c.id)} className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm">{c.title}</button>
              <button onClick={() => rename(c)} aria-label={`Rename ${c.title}`} className="p-1.5 opacity-60 hover:opacity-100"><Pencil size={14} /></button>
              <button onClick={() => remove(c)} aria-label={`Delete ${c.title}`} className="p-1.5 opacity-60 hover:opacity-100"><Trash2 size={14} /></button>
            </li>
          ))}
          {conversations.length === 0 && <li className="px-3 py-2 text-sm text-ink/60">No conversations yet.</li>}
        </ul>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-8" aria-live="polite">
          {messages.length === 0 && (
            <p className="mx-auto mt-16 max-w-md text-center text-ink/60">Say hello, or describe a problem. Each message you send is analyzed for sentiment, intent, emotion and keywords.</p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 md:max-w-[70%] ${m.sender === "user" ? "bg-spruce text-mist" : "bg-white shadow-sm"}`}>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                {m.analysis && <div className={m.sender === "user" ? "[&_span]:!text-ink [&_span]:!bg-mist/90" : ""}><AnalysisChips analysis={m.analysis} /></div>}
                <div className="mt-1.5 flex items-center gap-2 text-xs opacity-60">
                  <time>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                  {m.sender === "bot" && (
                    <button onClick={() => navigator.clipboard?.writeText(m.content)} aria-label="Copy response"><Copy size={12} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {sending && <p className="text-sm text-ink/60">Analyzing…</p>}
          <div ref={endRef} />
        </div>
        {error && <p role="alert" className="px-4 pb-2 text-sm text-coral md:px-8">{error}</p>}
        <form onSubmit={send} className="flex gap-2 border-t border-ink/10 bg-white/70 p-3 md:p-4">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} aria-label="Message"
            placeholder="Type a message" className="flex-1 rounded-lg border border-ink/20 bg-white px-3 py-2.5" />
          <button disabled={!text.trim() || sending} aria-label="Send message"
            className="rounded-lg bg-signal px-4 text-ink disabled:opacity-50"><Send size={18} /></button>
        </form>
      </section>
    </div>
  );
}
