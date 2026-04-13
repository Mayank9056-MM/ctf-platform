import Link from "next/link";
import {
  CHALLENGE_LIST_CATEGORY_CONFIG,
  DIFF_CONFIG,
} from "../../../config/challenge-list-ui.config";
import { ChallengeSummary } from "../../../types/challenge.types";
import { cn } from "@/lib/utils";
import { DiffBars } from "./DiffBars";
import { ChevronRight } from "lucide-react";

export function ChallengeCard({
  challenge,
  index,
}: {
  challenge: ChallengeSummary;
  index: number;
}) {
  const cat = CHALLENGE_LIST_CATEGORY_CONFIG[challenge.category];
  const diff = DIFF_CONFIG[challenge.difficulty];
  const Icon = cat.icon;

  const isSolved = !!challenge.solvedAt;
  const isClosed =
    challenge.closedAt && new Date(challenge.closedAt) < new Date();
  const isNew =
    challenge.publishedAt &&
    Date.now() - new Date(challenge.publishedAt).getTime() <
      1000 * 60 * 60 * 48;

  return (
    <Link
      href={`/challenges/${challenge.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-200",
        "animate-in fade-in slide-in-from-bottom-2",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30",
        isSolved
          ? "border-emerald-500/15 bg-emerald-950/8"
          : isClosed
            ? "border-white/[0.04] bg-white/[0.015] opacity-70"
            : "border-white/[0.06] bg-[#0d1117]/80 hover:border-white/[0.1]",
      )}
      style={{
        animationDelay: `${index * 35}ms`,
        animationFillMode: "both",
      }}
    >
      {/* Solved overlay */}
      {isSolved && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/30">
            <svg
              className="h-3 w-3 text-emerald-400"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Category accent glow on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse at top left, ${cat.color}06 0%, transparent 70%)`,
        }}
      />

      <div className="relative flex flex-col h-full p-5">
        {/* Category icon + tags row */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl ring-1",
                cat.bg,
              )}
              style={{ color: cat.color, borderColor: `${cat.color}25` }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p
                className="font-mono text-[9px] uppercase tracking-[0.2em]"
                style={{ color: cat.color }}
              >
                {cat.label}
              </p>
              <div className="flex items-center gap-1">
                <DiffBars difficulty={challenge.difficulty} />
                <span
                  className="font-mono text-[9px]"
                  style={{ color: diff.color }}
                >
                  {diff.label}
                </span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1">
            {isNew && !isSolved && (
              <span className="rounded-full bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[8px] text-cyan-400 ring-1 ring-cyan-500/20">
                NEW
              </span>
            )}
            {isClosed && (
              <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 font-mono text-[8px] text-slate-600 ring-1 ring-slate-500/15">
                CLOSED
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          className={cn(
            "font-mono text-sm font-semibold leading-snug mb-2 transition-colors duration-150",
            isSolved
              ? "text-emerald-300/80 line-through decoration-emerald-500/30"
              : "text-slate-200 group-hover:text-white",
          )}
        >
          {challenge.title}
        </h3>

        {/* Tags */}
        {challenge.tags && challenge.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {challenge.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-slate-600"
              >
                #{tag}
              </span>
            ))}
            {challenge.tags.length > 3 && (
              <span className="font-mono text-[9px] text-slate-800">
                +{challenge.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Stats row */}
        <div className="mt-3 border-t border-white/[0.05] pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Points */}
              <div>
                <p className="font-mono text-base font-bold tabular-nums text-white">
                  {challenge.currentPoints ?? challenge.points}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-slate-700">
                  pts
                </p>
              </div>
              {/* Solve count */}
              <div className="h-6 w-px bg-white/[0.05]" />
              <div>
                <p className="font-mono text-sm font-bold tabular-nums text-slate-400">
                  {challenge.solveCount}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-slate-700">
                  solves
                </p>
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-all duration-150",
                "text-slate-700 group-hover:translate-x-0.5",
                isSolved ? "text-emerald-500/40" : "group-hover:text-slate-400",
              )}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
