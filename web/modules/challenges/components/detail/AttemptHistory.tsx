import { cn } from "@/lib/utils";
import { useChallengeHistory } from "@/modules/submissions/hooks/useChallengeHistory";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, Clock } from "lucide-react";
import { useState } from "react";

/**
 * Displays a list of past attempts for a challenge.
 *
 * @param challengeId - The ID of the challenge to display attempts for.
 *
 * @returns A JSX element representing the attempt history panel.
 */
export function AttemptHistory({ challengeId }: { challengeId: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useChallengeHistory(challengeId, 1, open);
  const attempts = data?.submissions ?? [];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-600" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-700">
            My Attempts
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-600 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-white/[0.05]">
          {isLoading ? (
            <div className="p-5 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-xl bg-white/[0.04]"
                />
              ))}
            </div>
          ) : attempts.length === 0 ? (
            <p className="p-5 font-mono text-xs text-slate-700 text-center">
              No attempts yet
            </p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {attempts.map((a) => (
                <div key={a._id} className="flex items-center gap-3 px-5 py-3">
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]",
                      a.isCorrect
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-red-500/10 text-red-400/70",
                    )}
                  >
                    {a.isCorrect ? "✓" : "✗"}
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        "font-mono text-xs",
                        a.isCorrect ? "text-emerald-300" : "text-slate-600",
                      )}
                    >
                      {a.isCorrect
                        ? `+${a.pointsAwarded} pts earned`
                        : "Incorrect"}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-slate-700">
                    {formatDistanceToNow(new Date(a.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
