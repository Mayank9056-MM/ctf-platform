import { ChevronRight, Download } from "lucide-react";
import { Challenge } from "../../types/challenge.types";

/**
 * Attachments component for Challenge detail page.
 *
 * @param {Object} props - Component props
 * @param {Challenge["attachments"]} props.attachments - Attachments of the challenge
 *
 * @returns {JSX.Element} - Component JSX element
 */
export function Attachments({
  attachments,
}: {
  attachments: Challenge["attachments"];
}) {
  if (!attachments.length) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Download className="h-4 w-4 text-slate-600" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-700">
          Files ({attachments.length})
        </span>
      </div>
      <div className="space-y-2">
        {attachments.map((att) => (
          <a
            key={att._id}
            href={att.url}
            download={att.name}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 transition-all hover:border-white/[0.1] hover:bg-white/[0.04]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
              <Download className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm text-slate-300 truncate group-hover:text-white transition-colors">
                {att.name}
              </p>
              <p className="font-mono text-[10px] text-slate-700">
                {att.mimeType} · {formatSize(att.size)}
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-700 group-hover:text-slate-400 transition-all group-hover:translate-x-0.5" />
          </a>
        ))}
      </div>
    </div>
  );
}
