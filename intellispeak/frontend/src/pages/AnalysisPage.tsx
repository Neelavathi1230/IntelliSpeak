import { useState } from "react";
import { api, ApiError } from "../services/api";
import type { Analysis } from "../types";

export default function AnalysisPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setError(""); setBusy(true);
    try { setResult(await api.analyze(text)); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Analysis failed."); }
    finally { setBusy(false); }
  }

  const card = "rounded-xl bg-white p-4 shadow-sm";
  return (
    <div className="mx-auto h-full max-w-3xl space-y-4 overflow-y-auto p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold">Text analysis</h1>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={2000}
        aria-label="Text to analyze" placeholder="Paste or type text to analyze"
        className="w-full rounded-lg border border-ink/20 bg-white p-3" />
      <button onClick={run} disabled={!text.trim() || busy} className="rounded-lg bg-spruce px-5 py-2.5 font-medium text-mist disabled:opacity-50">
        {busy ? "Analyzing…" : "Analyze text"}
      </button>
      {error && <p role="alert" className="text-sm text-coral">{error}</p>}
      {result && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={card}><h2 className="text-sm text-ink/60">Sentiment</h2>
            <p className="font-display text-xl font-bold capitalize">{result.sentiment.label}</p>
            <p className="text-sm text-ink/60">Polarity {result.sentiment.score}</p></div>
          <div className={card}><h2 className="text-sm text-ink/60">Intent</h2>
            <p className="font-display text-xl font-bold">{result.intent.intent.replace("_", " ")}</p>
            <p className="text-sm text-ink/60">Rule confidence {Math.round(result.intent.confidence * 100)}%</p></div>
          <div className={card}><h2 className="text-sm text-ink/60">Emotion</h2>
            <p className="font-display text-xl font-bold capitalize">{result.emotion.label}</p></div>
          <div className={card}><h2 className="text-sm text-ink/60">Keywords</h2>
            <p>{result.keywords.join(", ") || "None"}</p></div>
          <div className={card}><h2 className="text-sm text-ink/60">Entities</h2>
            <p>{result.entities.map((e) => `${e.text} (${e.label})`).join(", ") || "None"}</p></div>
          <div className={card}><h2 className="text-sm text-ink/60">Statistics</h2>
            <p className="text-sm">Words {result.statistics.word_count}, characters {result.statistics.character_count}, sentences {result.statistics.sentence_count}</p>
            <p className="text-sm">Avg word length {result.statistics.average_word_length}, reading time {result.statistics.reading_time_seconds}s</p></div>
        </div>
      )}
    </div>
  );
}
