import { useSubmitFlag } from "@/modules/submissions/hooks/useSubmitFlag";
import { useRef, useState } from "react";
import {
  SubmitFlagFormData,
  submitFlagSchema,
} from "../../schemas/challenge.schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, Eye, EyeOff, Flag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A component to submit a flag for a challenge.
 * @param {Object} props - An object containing the challenge ID, whether the challenge is solved, and whether the challenge is closed.
 * @param {string} props.challengeId - The challenge ID.
 * @param {boolean} props.isSolved - Whether the challenge is solved.
 * @param {boolean} props.isClosed - Whether the challenge is closed.
 * @returns {React.ReactElement} - A React element representing the flag submission component.
 */
export function FlagSubmission({
  challengeId,
  isSolved,
  isClosed,
}: {
  challengeId: string;
  isSolved: boolean;
  isClosed: boolean;
}) {
  const {
    mutate: submit,
    isPending,
    data: lastResult,
  } = useSubmitFlag(challengeId);
  const [showFlag, setShowFlag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<SubmitFlagFormData>({
    resolver: zodResolver(submitFlagSchema),
  });

  const onSubmit = (data: SubmitFlagFormData) => {
    submit(data.flag, {
      onSuccess: (result) => {
        if (!result.isCorrect) {
          setError("flag", {
            message: result.message ?? "Incorrect flag. Try again.",
          });
        } else {
          reset();
        }
      },
    });
  };

  if (isSolved) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-6 text-center">
        <div className="mb-3 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/25">
            <Check className="h-7 w-7 text-emerald-400" />
          </div>
        </div>
        <p className="font-mono text-sm font-bold text-emerald-300">
          Mission Complete
        </p>
        <p className="mt-1 font-mono text-[11px] text-emerald-600">
          You&apos;ve already solved this challenge
        </p>
      </div>
    );
  }

  if (isClosed) {
    return (
      <div className="rounded-2xl border border-slate-500/15 bg-white/[0.02] p-6 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-slate-700" />
        <p className="font-mono text-sm text-slate-500">
          This challenge is closed
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Flag className="h-4 w-4 text-emerald-500/60" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-700">
          Submit Flag
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-700 pointer-events-none">
            $
          </div>
          <input
            {...register("flag")}
            ref={(e) => {
              register("flag").ref(e);
              (
                inputRef as React.MutableRefObject<HTMLInputElement | null>
              ).current = e;
            }}
            type={showFlag ? "text" : "password"}
            placeholder="CTF{...}"
            autoComplete="off"
            spellCheck={false}
            className={cn(
              "w-full rounded-xl border bg-white/[0.04] pl-8 pr-10 py-3.5 font-mono text-sm text-white placeholder:text-slate-700 outline-none transition-all",
              errors.flag
                ? "border-red-500/40 focus:ring-1 focus:ring-red-500/20"
                : "border-white/[0.07] focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20",
            )}
          />
          <button
            type="button"
            onClick={() => setShowFlag((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-600 hover:text-slate-300 transition-colors"
          >
            {showFlag ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {errors.flag && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-950/15 px-3 py-2.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-400" />
            <p className="font-mono text-xs text-red-300">
              {errors.flag.message}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-mono text-sm font-bold transition-all",
            "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
            "hover:shadow-[0_0_24px_rgba(52,211,153,0.25)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Flag className="h-4 w-4" />
          )}
          {isPending ? "Verifying…" : "Submit Flag"}
        </button>
      </form>
    </div>
  );
}
