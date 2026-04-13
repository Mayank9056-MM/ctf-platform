import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/components/Skeleton";
import { timeAgo } from "@/shared/utils/time";
import { useAdminChallengeSubmissions } from "@/modules/challenges/hooks/admin/useAdminChallengeSubmissions";

/**
 * Submissions tab for admin challenge page.
 *
 * @param {string} challengeId - The challenge to fetch submissions for.
 * @returns {JSX.Element} - The submissions tab component.
 */
export function SubmissionsTab({ challengeId }: { challengeId: string }) {
  const [page, setPage] = useState(1);
  const [correctOnly, setCorrectOnly] = useState<boolean | undefined>(
    undefined,
  );
  const { data, isLoading } = useAdminChallengeSubmissions(
    challengeId,
    page,
    undefined,
    correctOnly,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {(
          [
            [undefined, "All"],
            [true, "Correct"],
            [false, "Wrong"],
          ] as const
        ).map(([val, lbl]) => (
          <button
            key={String(val)}
            onClick={() => {
              setCorrectOnly(val);
              setPage(1);
            }}
            className={cn(
              "rounded-full px-2.5 py-1 font-mono text-[10px] border transition-all",
              correctOnly === val
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-slate-700 text-slate-500 hover:text-slate-300",
            )}
          >
            {lbl}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      )}

      {data?.submissions.map((sub) => (
        <div
          key={sub._id}
          className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2"
        >
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full shrink-0",
              sub.isCorrect ? "bg-emerald-400" : "bg-red-400",
            )}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-300 truncate font-mono">
              {sub.user.username}
            </p>
            {sub.team && (
              <p className="text-[10px] text-slate-500">{sub.team.name}</p>
            )}
          </div>
          {sub.isFirstBlood && (
            <span className="font-mono text-[9px] text-amber-400">
              🩸 first blood
            </span>
          )}
          <span className="font-mono text-[10px] text-slate-600 shrink-0">
            {timeAgo(sub.createdAt)}
          </span>
        </div>
      ))}

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={!data.meta.hasPrev}
            className="rounded-md border border-slate-700 p-1 text-slate-500 hover:text-slate-300 disabled:opacity-40"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <span className="font-mono text-[10px] text-slate-600">
            {data.meta.page} / {data.meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.meta.hasNext}
            className="rounded-md border border-slate-700 p-1 text-slate-500 hover:text-slate-300 disabled:opacity-40"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
