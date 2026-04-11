import { Terminal } from "lucide-react";

/**
 * A component to render a mission description.
 *
 * @param {object} props - Component props
 * @param {string} props.text - The text to render
 *
 * @returns {React.ReactElement} A React element
 */
export function Description({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Terminal className="h-4 w-4 text-slate-600" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-700">
          Mission Briefing
        </span>
      </div>
      {/* Basic markdown-like rendering — use react-markdown in production */}
      <div
        className="prose prose-invert prose-sm max-w-none
        prose-p:text-slate-400 prose-p:leading-relaxed
        prose-code:text-emerald-400 prose-code:bg-emerald-950/30 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-[#080c10] prose-pre:border prose-pre:border-white/[0.06] prose-pre:rounded-xl
        prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
        prose-strong:text-slate-200
        prose-headings:font-mono prose-headings:text-slate-300"
      >
        <p className="whitespace-pre-wrap text-sm text-slate-400 leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  );
}