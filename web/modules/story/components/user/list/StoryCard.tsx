import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Play,
  Star,
  Users,
} from "lucide-react";
import { XPBadge } from "./XPBadge";
import { cn } from "@/lib/utils";
import { ScanlineOverlay } from "./ScanlineOverlay";
import { StorySummary } from "@/modules/story/types/story.types";
import { DIFF_CONFIG } from "@/modules/story/config/user-list-ui.config";
import Link from "next/link";

export function StoryCard({ story }: { story: StorySummary }) {
  const diff = DIFF_CONFIG[story.difficulty];
  const DiffIcon = diff.icon;

  const isCompleted = story.userStatus === "completed";
  const isInProgress = story.userStatus === "in_progress";
  const isNew = !story.userStatus || story.userStatus === "not_started";

  const accentHex = story.accentColor ?? "#10b981";

  return (
    <Link href={`/stories/${story.slug}`} className="group block">
      <article
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0e15]/80 transition-all duration-300 hover:border-white/[0.12] hover:shadow-2xl"
        style={{
          boxShadow: `0 0 0 0 ${accentHex}00`,
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow =
            `0 0 40px -10px ${accentHex}30`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow =
            `0 0 0 0 ${accentHex}00`;
        }}
      >
        <ScanlineOverlay />

        {/* Accent top border */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentHex}60 50%, transparent 100%)`,
          }}
        />

        {/* Cover image or gradient placeholder */}
        <div className="relative h-44 overflow-hidden bg-[#0d1117]">
          {story.coverImageUrl ? (
            <img
              src={story.coverImageUrl}
              alt={story.title}
              className="h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `radial-gradient(ellipse at 30% 50%, ${accentHex}40 0%, transparent 70%), radial-gradient(ellipse at 80% 20%, ${accentHex}20 0%, transparent 60%)`,
              }}
            />
          )}

          {/* Corner badge — status */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
            {isCompleted && (
              <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 ring-1 ring-emerald-500/30 backdrop-blur-sm">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span className="font-mono text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                  Completed
                </span>
              </div>
            )}
            {isInProgress && (
              <div className="flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-1 ring-1 ring-blue-500/30 backdrop-blur-sm">
                <Play className="h-3 w-3 text-blue-400 fill-current" />
                <span className="font-mono text-[9px] font-bold text-blue-400 uppercase tracking-wider">
                  In Progress
                </span>
              </div>
            )}
            {isNew && (
              <div className="flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-1 ring-1 ring-violet-500/30 backdrop-blur-sm">
                <Star className="h-3 w-3 text-violet-400" />
                <span className="font-mono text-[9px] font-bold text-violet-400 uppercase tracking-wider">
                  New
                </span>
              </div>
            )}
          </div>

          {/* Bottom gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0e15] to-transparent" />

          {/* Tags row */}
          {story.tags.length > 0 && (
            <div className="absolute bottom-3 left-4 flex gap-1.5 flex-wrap">
              {story.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/[0.08] px-2 py-0.5 font-mono text-[9px] text-slate-400 backdrop-blur-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Title + difficulty */}
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="font-mono text-sm font-bold text-white leading-snug group-hover:text-emerald-300 transition-colors line-clamp-2">
              {story.title}
            </h3>
            <div
              className={cn(
                "shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 ring-1",
                diff.bg,
                diff.ring,
              )}
            >
              <DiffIcon className={cn("h-3 w-3", diff.color)} />
              <span
                className={cn(
                  "font-mono text-[9px] font-bold uppercase",
                  diff.color,
                )}
              >
                {diff.label}
              </span>
            </div>
          </div>

          {/* Tagline */}
          {story.tagline && (
            <p className="mb-4 font-mono text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
              {story.tagline}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {story.estimatedMinutes && (
                <div className="flex items-center gap-1 text-slate-600">
                  <Clock className="h-3 w-3" />
                  <span className="font-mono text-[10px]">
                    {story.estimatedMinutes}m
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 text-slate-600">
                <Users className="h-3 w-3" />
                <span className="font-mono text-[10px]">
                  {story.completionCount.toLocaleString()}
                </span>
              </div>
            </div>
            <XPBadge xp={story.completionXpBonus} />
          </div>
        </div>

        {/* CTA strip */}
        <div className="border-t border-white/[0.04] px-5 py-3 flex items-center justify-between">
          <span className="font-mono text-[10px] text-slate-600">
            by <span className="text-slate-500">{story.author.username}</span>
          </span>
          <div className="flex items-center gap-1 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
            <span className="font-mono text-[10px] font-bold">
              {isInProgress ? "Continue" : isCompleted ? "Replay" : "Start"}
            </span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </article>
    </Link>
  );
}
