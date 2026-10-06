export interface User { id: number; name: string; email: string; created_at: string }
export interface Analysis {
  sentiment: { label: "positive" | "negative" | "neutral"; score: number };
  intent: { intent: string; confidence: number };
  emotion: { label: string };
  keywords: string[];
  entities: { text: string; label: string }[];
  statistics: Record<string, number>;
}
export interface Message {
  id: number; conversation_id: number; sender: "user" | "bot"; content: string;
  input_type: "text" | "voice"; created_at: string; analysis: Analysis | null;
}
export interface Conversation { id: number; title: string; created_at: string; updated_at: string }
