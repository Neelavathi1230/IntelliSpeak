import type { Analysis, Conversation, Message, User } from "../types";

const TOKEN_KEY = "intellispeak_token";
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Can't reach the server. Check your connection and try again.", 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new ApiError(body?.error?.code ?? "UNKNOWN", body?.error?.message ?? "Something went wrong.", res.status);
  }
  return body.data as T;
}

export const api = {
  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request<User>("/auth/me"),
  conversations: () => request<Conversation[]>("/chat/conversations"),
  conversation: (id: number) => request<{ conversation: Conversation; messages: Message[] }>(`/chat/conversations/${id}`),
  renameConversation: (id: number, title: string) =>
    request<Conversation>(`/chat/conversations/${id}`, { method: "PATCH", body: JSON.stringify({ title }) }),
  deleteConversation: (id: number) => request<null>(`/chat/conversations/${id}`, { method: "DELETE" }),
  sendMessage: (text: string, conversationId: number | null) =>
    request<{ conversation: Conversation; user_message: Message; bot_message: Message }>("/chat/message", {
      method: "POST",
      body: JSON.stringify({ text, conversation_id: conversationId, input_type: "text" }),
    }),
  analyze: (text: string) => request<Analysis>("/analyze/text", { method: "POST", body: JSON.stringify({ text }) }),
};
