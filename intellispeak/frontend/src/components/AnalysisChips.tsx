import type { Analysis } from "../types";

const sentimentStyle = {
  positive: "bg-sage/15 text-spruce", negative: "bg-coral/15 text-coral", neutral: "bg-ink/10 text-ink",
};

export default function AnalysisChips({ analysis }: { analysis: Analysis }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5 text-xs" aria-label="Message analysis">
      <span className={`rounded-full px-2.5 py-1 font-medium ${sentimentStyle[analysis.sentiment.label]}`}>
        {analysis.sentiment.label}
      </span>
      <span className="rounded-full bg-signal/20 px-2.5 py-1 font-medium">{analysis.intent.intent.replace("_", " ")}</span>
      <span className="rounded-full bg-ink/10 px-2.5 py-1">{analysis.emotion.label}</span>
      {analysis.keywords.slice(0, 4).map((k) => (
        <span key={k} className="rounded-full border border-ink/15 px-2.5 py-1">{k}</span>
      ))}
    </div>
  );
}
