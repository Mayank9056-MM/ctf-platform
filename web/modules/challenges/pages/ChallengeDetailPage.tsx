"use client";

import { useChallengeDetail } from "../hooks/useChallengeDetail";
import { DetailSkeleton } from "../components/detail/DetailSkeleton";
import { AlertCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { CHALLENGE_DETAIL_CATEGORY_CONFIG } from "../config/challenge-detail-ui.config";
import { ChallengeHeader } from "../components/detail/ChallengeHeader";
import { Description } from "../components/detail/Description";
import { Attachments } from "../components/detail/Attachments";
import { SolvesBoard } from "../components/detail/SolvesBoard";
import { AttemptHistory } from "../components/detail/AttemptHistory";
import { FlagSubmission } from "../components/detail/FlagSubmission";
import { HintsPanel } from "../components/detail/HintsPanel";
import { formatDistanceToNow } from "date-fns";
import { Ambient } from "../components/detail/Ambient";

export default function ChallengeDetailPage({ slug }: { slug: string }) {

  console.log(slug,"slug from challenge detail page");

  const {
    data: challenge,
    isLoading,
    isError,
  } = useChallengeDetail(slug);

  if (isLoading)
    return (
      <div className="relative z-10">
        <Ambient color="#34d39910" />
        <DetailSkeleton />
      </div>
    );

  if (isError || !challenge)
    return (
      <div className="relative z-10 flex flex-col items-center justify-center py-32 text-center">
        <Ambient color="#f8717110" />
        <AlertCircle className="mb-4 h-10 w-10 text-red-400/50" />
        <p className="font-mono text-sm font-medium text-slate-500">
          Challenge not found
        </p>
        <Link
          href="/challenges"
          className="mt-4 flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-slate-300 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to challenges
        </Link>
      </div>
    );

  const cat = CHALLENGE_DETAIL_CATEGORY_CONFIG[challenge.category];
  const isSolved = !!challenge.solvedAt;
  const isClosed = !!(
    challenge.closedAt && new Date(challenge.closedAt) < new Date()
  );

  return (
    <>
      <Ambient color={`${cat.color}08`} />
      <div className="relative z-10 mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:items-start">
          {/* Left: main content */}
          <div className="space-y-6 mb-8 lg:mb-0">
            <ChallengeHeader challenge={challenge} />
            <Description text={challenge.description} />
            {challenge.attachments.length > 0 && (
              <Attachments attachments={challenge.attachments} />
            )}
            {/* Solve board + history — collapsible to keep page clean */}
            <SolvesBoard
              challengeId={challenge._id}
              solveCount={challenge.solveCount}
            />
            <AttemptHistory challengeId={challenge._id} />
          </div>

          {/* Right: action sidebar */}
          <div className="space-y-4 lg:sticky lg:top-20">
            {/* Flag submission — the primary action */}
            <FlagSubmission
              challengeId={challenge._id}
              isSolved={isSolved}
              isClosed={isClosed}
            />
            {/* Hints */}
            {challenge.hints.length > 0 && (
              <HintsPanel hints={challenge.hints} challengeId={challenge._id} />
            )}
            {/* Author */}
            <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3.5">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700 mb-1">
                Created by
              </p>
              <Link
                href={`/profile/${challenge.author.username}`}
                className="font-mono text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {challenge.author.username}
              </Link>
              {challenge.publishedAt && (
                <p className="font-mono text-[9px] text-slate-800 mt-0.5">
                  {formatDistanceToNow(new Date(challenge.publishedAt), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
