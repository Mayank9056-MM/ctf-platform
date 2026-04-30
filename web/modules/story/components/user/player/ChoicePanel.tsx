import { cn } from "@/lib/utils";
import { StoryNode } from "@/modules/story/types/story.types";
import { Check, GitBranch, Loader2 } from "lucide-react";
import { useState } from "react";

 
export function ChoicePanel({
  node,
  onChoice,
  isLoading,
}: {
  node: StoryNode;
  onChoice: (label: string) => void;
  isLoading: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
 
  const handleSelect = (label: string) => {
    if (isLoading || selected) return;
    setSelected(label);
    onChoice(label);
  };
 
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-[#0d1117]/90 p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-amber-400" />
        <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wider">
          Make your choice
        </span>
      </div>
 
      {node.preNarrative && (
        <p className="mb-6 font-mono text-sm text-slate-400 leading-relaxed">
          {node.preNarrative}
        </p>
      )}
 
      <div className="space-y-3">
        {node.choices?.map((choice) => (
          <button
            key={choice.label}
            onClick={() => handleSelect(choice.label)}
            disabled={isLoading || !!selected}
            className={cn(
              "group relative w-full overflow-hidden rounded-xl border p-4 text-left transition-all duration-200",
              selected === choice.label
                ? "border-amber-500/50 bg-amber-500/10"
                : selected
                ? "border-white/[0.03] bg-white/[0.01] opacity-30"
                : "border-white/[0.07] bg-white/[0.02] hover:border-amber-500/30 hover:bg-amber-500/[0.04]",
            )}
          >
            {/* Left accent */}
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-0.5 transition-all",
                selected === choice.label
                  ? "bg-amber-400"
                  : "bg-transparent group-hover:bg-amber-500/30",
              )}
            />
 
            <div className="flex items-start gap-3 pl-2">
              <div
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                  selected === choice.label
                    ? "border-amber-400 bg-amber-500/20"
                    : "border-white/[0.1] bg-white/[0.03]",
                )}
              >
                {selected === choice.label && isLoading ? (
                  <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />
                ) : selected === choice.label ? (
                  <Check className="h-3 w-3 text-amber-400" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "font-mono text-sm font-bold transition-colors",
                    selected === choice.label ? "text-amber-300" : "text-slate-300 group-hover:text-white",
                  )}
                >
                  {choice.label}
                </p>
                {choice.description && (
                  <p className="mt-1 font-mono text-[11px] text-slate-600">
                    {choice.description}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}