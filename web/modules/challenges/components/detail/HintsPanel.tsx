import { useState } from "react";
import { Challenge } from "../../types/challenge.types";
import { usePurchaseHint } from "../../hooks/usePurchaseHint";
import { Eye, EyeOff, Loader2, Lock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A panel to display hints for a challenge.
 *
 * @param hints - An array of hint objects.
 * @param challengeId - The ID of the challenge.
 *
 * @returns A JSX element representing the hint panel.
 */
export function HintsPanel({
  hints,
  challengeId,
}: {
  hints: Challenge["hints"];
  challengeId: string;
}) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const {
    mutate: purchase,
    isPending: isPurchasing,
    variables: purchasingIdx,
  } = usePurchaseHint(challengeId);

  if (!hints.length) return null;

  const toggleReveal = (order: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(order)) next.delete(order);
      else next.add(order);
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-4 w-4 text-slate-600" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-700">
          Intel ({hints.length})
        </span>
        <span className="ml-auto font-mono text-[9px] text-slate-800">
          Purchasing a hint deducts points
        </span>
      </div>
      <div className="space-y-2">
        {hints.map((hint, i) => {
          const isRevealed = revealed.has(hint.order);
          const isPurchased = hint.isPurchased;
          const isBuying = isPurchasing && purchasingIdx === i;

          return (
            <div
              key={hint.order}
              className={cn(
                "rounded-xl border transition-all",
                isPurchased
                  ? "border-amber-500/15 bg-amber-950/10"
                  : "border-white/[0.05] bg-white/[0.02]",
              )}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold",
                    isPurchased
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-white/[0.05] text-slate-600",
                  )}
                >
                  {hint.order}
                </div>
                <div className="flex-1">
                  <p className="font-mono text-[10px] text-slate-600">
                    {isPurchased
                      ? isRevealed
                        ? hint.text
                        : "Click to reveal"
                      : `−${hint.cost} pts to unlock`}
                  </p>
                </div>

                {isPurchased ? (
                  <button
                    onClick={() => toggleReveal(hint.order)}
                    className="rounded-lg p-1.5 text-slate-600 hover:text-amber-400 transition-colors"
                  >
                    {isRevealed ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => purchase(i)}
                    disabled={isBuying}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 py-1.5 font-mono text-[10px] text-amber-400 ring-1 ring-amber-500/20 hover:bg-amber-500/20 disabled:opacity-50 transition-all"
                  >
                    {isBuying ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Lock className="h-3 w-3" />
                    )}
                    {hint.cost > 0 ? `${hint.cost}pts` : "Free"}
                  </button>
                )}
              </div>

              {/* Revealed hint text */}
              {isPurchased && isRevealed && hint.text && (
                <div className="border-t border-amber-500/10 px-4 py-3">
                  <p className="text-sm text-amber-200/80 leading-relaxed">
                    {hint.text}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
