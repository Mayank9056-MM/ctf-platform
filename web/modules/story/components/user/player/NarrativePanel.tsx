import { ChevronRight, SkipForward } from "lucide-react";
import { CharacterAvatar } from "./CharacterAvatar";
import { on } from "events";

export function NarrativePanel({
  text,
  character,
  onDone,
  onSkip,
  done,
}: {
  text: string;
  character?: { name: string; avatarUrl?: string } | null;
  onDone: () => void;
  onSkip: () => void;
  done: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1117]/90 p-8 cursor-pointer"
      onClick={done ? onDone : onSkip}
    >
      {/* Scanlines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)",
        }}
      />

      {/* Corner decoration */}
      <div className="absolute top-0 left-0 h-8 w-8 border-t border-l border-violet-500/30 rounded-tl-2xl" />
      <div className="absolute bottom-0 right-0 h-8 w-8 border-b border-r border-violet-500/30 rounded-br-2xl" />

      {character && (
        <CharacterAvatar
          name={character.name}
          avatarUrl={character.avatarUrl}
        />
      )}

      <p className="font-mono text-sm text-slate-300 leading-[1.9] min-h-[80px]">
        {text}
        {!done && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-violet-400 align-middle" />
        )}
      </p>

      {/* CTA */}
      <div className="mt-6 flex items-center justify-end gap-3">
        {!done && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (done) onDone();
              else onSkip();
            }}
            className="font-mono text-[10px] text-slate-700 hover:text-slate-500 transition-colors flex items-center gap-1"
          >
            <SkipForward className="h-3 w-3" /> Skip
          </button>
        )}
        {done && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (done) onDone();
              else onSkip();
            }}
            className="flex items-center gap-2 rounded-xl bg-violet-600/80 px-5 py-2.5 font-mono text-xs font-bold text-white transition-all hover:bg-violet-500 active:scale-[0.98] ring-1 ring-violet-400/30"
          >
            Continue <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
