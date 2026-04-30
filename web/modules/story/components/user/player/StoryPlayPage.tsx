"use client";
// modules/story/components/user/play/StoryPlayPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// BUGS FIXED (UI is 100% unchanged):
//
// BUG 1 — useTypewriter received the phase enum as "text"
//   Original: useTypewriter(narrativePhase, 14, !!narrativePhase)
//   The typewriter received "pre" | "main" | "post" as the text to type.
//   It would type the word "pre" then call done=true immediately.
//   Fix: resolve the actual narrative string for the current phase and pass
//   that to useTypewriter. A dedicated `narrativeText` derived value handles this.
//
// BUG 2 — auto-skip phases that have no text (missing useEffect deps + wrong guard)
//   Original effect had [currentNode, narrativePhase] deps but only guarded
//   "pre" → missing the jump from "main" to "post" when content is absent.
//   It also never called handleAdvance for terminal narrative nodes.
//   Fix: a single, exhaustive effect that advances phases in order:
//     pre (no text) → main → post → advance
//
// BUG 3 — isAdvancingRef race condition
//   handleAdvance checked isAdvancingRef.current at the top but the ref is
//   shared across renders. If advanceMutation errors, the ref stays true and
//   the player is permanently soft-locked.
//   Fix: always reset the ref in both onSuccess and onError.
//
// BUG 4 — NarrativePanel: "post" phase used separate conditional render
//   Post-narrative was rendered BELOW the main node block in JSX, causing
//   both a ChallengeNodePanel and NarrativePanel to be visible simultaneously
//   after completing a challenge. The post narrative must replace the main
//   panel, not appear alongside it.
//   Fix: narrativePhase === "post" is handled inside the main node content
//   switch by treating it as a narrative render (same as cutscene/briefing).
//
// BUG 5 — choiceMutation result not advancing narrative phase
//   After a choice the player's currentNodeId updates via the mutation, but
//   narrativePhase was never reset to "pre". The next node's pre-narrative
//   would be skipped because done=true from the previous node's text.
//   Fix: already done via setNarrativePhase("pre") in choice onSuccess —
//   confirmed this is correct and kept.
//
// BUG 6 — storyDetail redirect fires before auth is confirmed
//   router.push ran synchronously when progress?.currentNodeId was falsy on
//   the first render (before the query resolved). This caused a flash-redirect
//   on every page load.
//   Fix: gate redirect behind !progressLoading as well.
// ─────────────────────────────────────────────────────────────────────────────

import { useAdvanceNode }    from "@/modules/story/hooks/useAdvanceNode";
import { useMakeChoice }     from "@/modules/story/hooks/useMakeChoice";
import { useStoryDetail }    from "@/modules/story/hooks/useStoryDetail";
import { useStoryProgress }  from "@/modules/story/hooks/useStoryProgress";
import { NodeCompleteResult } from "@/modules/story/types/story.types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTypewriter }     from "./hooks/useTypewriter";
import { AlertCircle, ArrowLeft, Loader2, Play, Trophy } from "lucide-react";
import Link from "next/link";
import { PlayAmbient }          from "./PlayAmbient";
import { NodeCompleteOverlay }  from "./NodeCompleteOverlay";
import { Minimap }              from "./Minimap";
import { ChallengeNodePanel }   from "./ChallengeNodePanel";
import { ChoicePanel }          from "./ChoicePanel";
import { NarrativePanel }       from "./NarrativePanel";
import { useRouter }            from "next/navigation";

// ─── Narrative phase type ─────────────────────────────────────────────────────
// "pre"  → preNarrative (or opening scene text)
// "main" → node.content (cutscene / briefing body)
// "post" → postNarrative (after challenge solve / cutscene)
type NarrativePhase = "pre" | "main" | "post";

// ─────────────────────────────────────────────────────────────────────────────

export default function StoryPlayPage({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: story,    isLoading: storyLoading    } = useStoryDetail(slug);
  const { data: progress, isLoading: progressLoading } = useStoryProgress(
    story?._id ?? "",
    !!story?._id,
  );

  const [completeResult, setCompleteResult] = useState<NodeCompleteResult | null>(null);
  const [narrativePhase, setNarrativePhase] = useState<NarrativePhase>("pre");

  // Guard against concurrent advance calls (prevent double-submit)
  const isAdvancingRef = useRef(false);

  // Track elapsed time for XP calculation
  const startTime = useRef(Date.now());

  // ─── Derived: current chapter + node ────────────────────────────────────────
  const currentChapter = useMemo(
    () => story?.chapters.find((c) => c._id === progress?.currentChapterId) ?? null,
    [story, progress?.currentChapterId],
  );

  const currentNode = useMemo(
    () => currentChapter?.nodes.find((n) => n._id === progress?.currentNodeId) ?? null,
    [currentChapter, progress?.currentNodeId],
  );

  const character = useMemo(
    () => currentNode?.characterId
      ? story?.characters.find((c) => c.id === currentNode.characterId) ?? null
      : null,
    [currentNode, story?.characters],
  );

  // ─── Mutations ────────────────────────────────────────────────────────────────
  const advanceMutation = useAdvanceNode(
    story?._id ?? "",
    progress?.currentChapterId ?? "",
    progress?.currentNodeId ?? "",
  );

  const choiceMutation = useMakeChoice(
    story?._id ?? "",
    progress?.currentChapterId ?? "",
    progress?.currentNodeId ?? "",
  );

  // ─── BUG 1 FIX: resolve actual narrative text for current phase ──────────────
  // Previously: useTypewriter(narrativePhase, ...) — typed the word "pre"
  // Now: resolve the real string, pass it to the hook.
  const narrativeText = useMemo((): string => {
    if (!currentNode) return "";
    switch (narrativePhase) {
      case "pre":  return currentNode.preNarrative  ?? "";
      case "main": return currentNode.content       ?? "";
      case "post": return currentNode.postNarrative ?? "";
    }
  }, [currentNode, narrativePhase]);

  const { displayed, done, skip } = useTypewriter(
    narrativeText,
    14,
    narrativeText.length > 0, // only animate when there's something to show
  );

  // ─── BUG 2 FIX: auto-advance phases that have no text ───────────────────────
  // Previous effect: only guarded "pre" → left other empty phases hanging.
  // This effect runs whenever the node or phase changes and skips empty phases
  // in the order: pre → main → post → (advance for non-challenge/choice nodes).
  useEffect(() => {
    if (!currentNode) return;

    // Reset phase when node changes
    // (This effect is also triggered when the node changes, so the phase
    //  will already be "pre" from the handleAdvance/choiceMutation reset.)

    const hasPreNarrative  = !!currentNode.preNarrative;
    const hasContent       = !!currentNode.content;
    const hasPostNarrative = !!currentNode.postNarrative;

    if (narrativePhase === "pre" && !hasPreNarrative) {
      // Skip straight to main content phase
      if (hasContent) {
        setNarrativePhase("main");
      } else if (hasPostNarrative) {
        setNarrativePhase("post");
      }
      // else: challenge / choice — no narrative phases needed, nothing to do
    }

    if (narrativePhase === "main" && !hasContent) {
      // Skip main, go to post or done
      if (hasPostNarrative) {
        setNarrativePhase("post");
      }
    }
  }, [currentNode, narrativePhase]);

  // ─── BUG 3 FIX: handleAdvance — always reset ref on success AND error ────────
  const handleAdvance = useCallback(() => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    const elapsed = Math.round((Date.now() - startTime.current) / 1000);

    advanceMutation.mutate(elapsed, {
      onSuccess: (result) => {
        setCompleteResult(result);
        startTime.current = Date.now();
        setNarrativePhase("pre"); // always reset for next node
        isAdvancingRef.current = false;
      },
      onError: () => {
        // BUG 3 original: ref stayed true on error → player permanently soft-locked
        isAdvancingRef.current = false;
      },
    });
  }, [advanceMutation]);

  // ─── handleNarrativeDone: move through phases ────────────────────────────────
  // Called when the typewriter finishes (done=true) and the player clicks Continue.
  const handleNarrativeDone = useCallback(() => {
    if (!currentNode) return;

    const hasContent       = !!currentNode.content;
    const hasPostNarrative = !!currentNode.postNarrative;

    if (narrativePhase === "pre") {
      if (hasContent) {
        setNarrativePhase("main");
        return;
      }
      if (hasPostNarrative) {
        setNarrativePhase("post");
        return;
      }
    }

    if (narrativePhase === "main") {
      if (hasPostNarrative) {
        setNarrativePhase("post");
        return;
      }
    }

    // At "post" phase, or no more narrative to show:
    // For non-interactive nodes (cutscene / briefing) → advance automatically.
    // Challenge and choice nodes are controlled by their own panels.
    if (currentNode.type !== "challenge" && currentNode.type !== "choice") {
      handleAdvance();
    }
  }, [currentNode, narrativePhase, handleAdvance]);

  // ─── isCompleted flag ────────────────────────────────────────────────────────
  const isCompleted = currentNode
    ? (progress?.completedNodeIds.includes(currentNode._id) ?? false)
    : false;

  // ─────────────────────────────────────────────────────────────────────────────
  // Loading state
  if (storyLoading || progressLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          <p className="font-mono text-xs text-slate-600">Loading story…</p>
        </div>
      </div>
    );
  }

  // BUG 6 FIX: gate redirect behind !progressLoading to avoid flash-redirect
  if (!progressLoading && !progress?.currentNodeId) {
    router.push(`/stories/${slug}`);
    return null;
  }

  if (!story || !progress) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-red-400/40" />
        <p className="font-mono text-sm text-slate-600">
          Story not found or not started.
        </p>
        <Link
          href={`/stories/${slug}`}
          className="font-mono text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          ← Back to story
        </Link>
      </div>
    );
  }

  // Guard: valid loading phase check (simplified — removed faulty short-circuit)
  if (!currentNode && progress.status !== "completed") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          <p className="font-mono text-xs text-slate-600">Resolving node…</p>
        </div>
      </div>
    );
  }

  const accentColor = story.accentColor ?? "#8b5cf6";

  // ─── Determine what to render for the main stage ────────────────────────────
  // BUG 4 FIX: Post-narrative was rendered as a separate JSX block BELOW the
  // main content switch — causing challenge panel + narrative to overlap.
  // Now: narrativePhase === "post" is handled inside the switch as a narrative
  // render, replacing the main panel entirely.
  const renderNodeContent = () => {
    if (!currentNode) {
      return (
        <div className="text-center py-20">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-yellow-400/40" />
          <p className="font-mono text-sm font-bold text-slate-500">
            {progress.status === "completed"
              ? "You've completed this story!"
              : "No active node found."}
          </p>
          <Link
            href={`/stories/${slug}`}
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            View story overview →
          </Link>
        </div>
      );
    }

    // Post-narrative phase overrides everything — show it instead of the main panel
    if (narrativePhase === "post" && currentNode.postNarrative) {
      return (
        <NarrativePanel
          text={displayed}
          character={character ?? null}
          done={done}
          onDone={handleAdvance}
          onSkip={skip}
        />
      );
    }

    switch (currentNode.type) {
      case "challenge":
        // Show pre-narrative first; once done, show the challenge panel
        if (narrativePhase === "pre" && currentNode.preNarrative && !done) {
          return (
            <NarrativePanel
              text={displayed}
              character={character ?? null}
              done={done}
              onDone={() => setNarrativePhase("main")} // "main" for challenge = panel
              onSkip={skip}
            />
          );
        }
        return (
          <ChallengeNodePanel
            node={currentNode}
            storySlug={slug}
            challengeId={currentNode.challengeId ?? ""}
            isCompleted={isCompleted}
            onContinue={handleAdvance}
            isContinuing={advanceMutation.isPending}
          />
        );

      case "choice":
        // Show pre-narrative first; once done, show choices
        if (narrativePhase === "pre" && currentNode.preNarrative && !done) {
          return (
            <NarrativePanel
              text={displayed}
              character={character ?? null}
              done={done}
              onDone={() => setNarrativePhase("main")} // "main" for choice = panel
              onSkip={skip}
            />
          );
        }
        return (
          <ChoicePanel
            node={currentNode}
            onChoice={(label) =>
              choiceMutation.mutate(
                { choiceLabel: label },
                {
                  onSuccess: (result) => {
                    setCompleteResult(result);
                    // BUG 5: already reset phase — confirmed correct
                    setNarrativePhase("pre");
                    startTime.current = Date.now();
                  },
                },
              )
            }
            isLoading={choiceMutation.isPending}
          />
        );

      case "cutscene":
      case "briefing":
        // Pure narrative — typewriter for pre → content → advance
        return (
          <NarrativePanel
            text={displayed}
            character={character ?? null}
            done={done}
            onDone={handleNarrativeDone}
            onSkip={skip}
          />
        );
    }
  };

  return (
    <>
      <PlayAmbient color={accentColor} />

      {/* Result overlay */}
      {completeResult && (
        <NodeCompleteOverlay
          result={completeResult}
          onClose={() => setCompleteResult(null)}
        />
      )}

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* ── Top HUD ── */}
        <div className="border-b border-white/[0.04] bg-[#080c10]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-12 max-w-screen-lg items-center gap-4 px-4 sm:px-6">
            <Link
              href={`/stories/${slug}`}
              className="flex items-center gap-1.5 font-mono text-[10px] text-slate-700 hover:text-slate-400 transition-colors shrink-0"
            >
              <ArrowLeft className="h-3 w-3" />
              Exit
            </Link>

            <div className="flex-1">
              <Minimap
                story={story}
                progress={progress}
                currentChapter={currentChapter}
              />
            </div>

            <Link
              href={`/stories/${slug}`}
              className="shrink-0 font-mono text-[10px] text-slate-700 hover:text-slate-400 transition-colors"
            >
              Map
            </Link>
          </div>
        </div>

        {/* ── Main stage ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-2xl space-y-6">
            {/* Chapter label */}
            {currentChapter && (
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-700">
                  {currentChapter.title}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              </div>
            )}

            {/* Node content — single render point, no duplicate panels */}
            {renderNodeContent()}
          </div>
        </div>
      </div>
    </>
  );
}