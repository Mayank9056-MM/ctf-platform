"use client";

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Clock,
  Layers,
  Star,
  Users,
} from "lucide-react";
import { ChapterAccordion } from "./ChapterAccordion";
import { CharactersPanel } from "./CharactersPanel";
import { LeaderboardCard } from "./LeaderboardCard";
import { ProgressCard } from "./ProgressCard";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Ambient } from "./Ambient";
import { StoryDetailSkeleton } from "./StoryDetailSkeleton";
import { useStartStory } from "@/modules/story/hooks/useStartStory";
import { useStoryProgress } from "@/modules/story/hooks/useStoryProgress";
import { useStoryDetail } from "@/modules/story/hooks/useStoryDetail";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StoryDetailPage({ slug }: { slug: string }) {
  const { data: story, isLoading, isError } = useStoryDetail(slug);
  const { data: progress, isLoading: progressLoading } = useStoryProgress(
    story?._id ?? "",
    !!story?._id,
  );
  const router = useRouter();
  const startMutation = useStartStory(story?._id ?? "");

  useEffect(() => {
    if (story?._id && !progress && !startMutation.isPending) {
      startMutation.mutate();
    }
  }, [story?._id, progress]);

  if (isLoading) {
    return (
      <div className="relative z-10 mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
        <Ambient />
        <StoryDetailSkeleton />
      </div>
    );
  }

  if (isError || !story) {
    return (
      <div className="relative z-10 flex flex-col items-center justify-center py-40 text-center">
        <Ambient />
        <AlertCircle className="mb-4 h-12 w-12 text-red-400/40" />
        <p className="font-mono text-sm font-bold text-slate-500">
          Story not found
        </p>
        <Link
          href="/stories"
          className="mt-4 flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to stories
        </Link>
      </div>
    );
  }

  const accentColor = story.accentColor ?? "#8b5cf6";

  return (
    <>
      <Ambient color={accentColor} />

      <div className="relative z-10 mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Breadcrumb ── */}
        <div className="mb-6 flex items-center gap-2 text-slate-700">
          <Link
            href="/stories"
            className="flex items-center gap-1.5 font-mono text-[10px] hover:text-slate-400 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            The Archives
          </Link>
          <span>/</span>
          <span className="font-mono text-[10px] text-slate-600 truncate max-w-xs">
            {story.title}
          </span>
        </div>

        {/* ── Hero header ── */}
        <div className="mb-10 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0a0e15]/80 relative">
          {/* Background accent */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              background: `radial-gradient(ellipse at 60% 0%, ${accentColor} 0%, transparent 60%)`,
            }}
          />

          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${accentColor}60 30%, ${accentColor}80 50%, ${accentColor}60 70%, transparent 100%)`,
            }}
          />

          <div className="relative flex flex-col gap-6 p-8 md:flex-row md:items-start">
            {/* Left: cover art */}
            {story.coverImageUrl && (
              <div className="shrink-0">
                <div className="h-36 w-28 overflow-hidden rounded-2xl border border-white/[0.1] shadow-2xl">
                  <img
                    src={story.coverImageUrl}
                    alt={story.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Right: meta */}
            <div className="flex-1 min-w-0">
              {/* Tags */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {story.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/[0.06] px-2.5 py-0.5 font-mono text-[9px] text-slate-500"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <h1 className="mb-2 font-mono text-2xl font-black text-white sm:text-3xl leading-tight">
                {story.title}
              </h1>

              {story.tagline && (
                <p className="mb-4 font-mono text-sm text-slate-500 italic">
                  {story.tagline}
                </p>
              )}

              {story.description && (
                <p className="mb-5 font-mono text-xs text-slate-600 leading-relaxed max-w-2xl">
                  {story.description}
                </p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="font-mono text-[10px]">
                    {story.chapters.length} chapter
                    {story.chapters.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {story.estimatedMinutes && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-mono text-[10px]">
                      ~{story.estimatedMinutes} min
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span className="font-mono text-[10px]">
                    {story.completionCount.toLocaleString()} completion
                    {story.completionCount !== 1 ? "s" : ""}
                  </span>
                </div>
                {story.publishedAt && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5" />
                    <span className="font-mono text-[10px]">
                      Published{" "}
                      {formatDistanceToNow(new Date(story.publishedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
          {/* ── Left: chapters ── */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-600" />
                <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Story Chapters
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-700">
                {story.chapters.length} total
              </span>
            </div>

            <div className="space-y-3">
              {story.chapters.map((chapter, i) => (
                <ChapterAccordion
                  key={chapter._id}
                  chapter={chapter}
                  index={i}
                  progress={progress}
                  isCurrentChapter={progress?.currentChapterId === chapter._id}
                  defaultOpen={
                    i === 0 || progress?.currentChapterId === chapter._id
                  }
                />
              ))}
            </div>
          </div>

          {/* ── Right: sidebar ── */}
          <div className="space-y-5 lg:sticky lg:top-20 self-start">
            <ProgressCard
              story={story}
              progress={progress}
              onStart={() =>
                startMutation.mutate(undefined, {
                  onSuccess: () => {
                    router.push(`/stories/${slug}/play`);
                  },
                })
              }
              isStarting={startMutation.isPending}
            />
            <CharactersPanel story={story} />
            <LeaderboardCard storyId={story._id} />
          </div>
        </div>
      </div>
    </>
  );
}
