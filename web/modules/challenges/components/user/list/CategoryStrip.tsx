import { cn } from "@/lib/utils";
import {
  CHALLENGE_CATEGORIES,
  ChallengeCategory,
} from "../../../types/challenge.types";
import { Layers } from "lucide-react";
import { CHALLENGE_LIST_CATEGORY_CONFIG } from "../../../config/challenge-list-ui.config";

/**
 * A component for displaying a category strip with a "All" button and buttons for each challenge category.
 * The component takes in two props: `active` and `onChange`. `active` is the currently active category, and `onChange` is a function that is called when a category button is clicked.
 * The component renders a `div` with the class `flex flex-wrap gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500`, and a style that sets the animation delay to 80ms and the animation fill mode to both.
 * Inside the `div`, the component renders a `button` for each challenge category, as well as an "All" button.
 * Each button has the class `flex items-center gap-1.5 rounded-xl px-3 py-2 font-mono text-[10px] font-semibold transition-all duration-150`, and is styled to have a ring and text color based on whether or not the category is active.
 * When a button is clicked, the `onChange` function is called with the category of the button as an argument.
 */
export function CategoryStrip({
  active,
  onChange,
}: {
  active: ChallengeCategory | null;
  onChange: (c: ChallengeCategory | null) => void;
}) {
  return (
    <div
      className="flex flex-wrap gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500"
      style={{ animationDelay: "80ms", animationFillMode: "both" }}
    >
      <button
        onClick={() => onChange(null)}
        className={cn(
          "flex items-center gap-1.5 rounded-xl px-3 py-2 font-mono text-[10px] font-semibold transition-all",
          !active
            ? "bg-white/[0.07] text-slate-200 ring-1 ring-white/[0.12]"
            : "border border-white/[0.05] text-slate-600 hover:border-white/[0.1] hover:text-slate-400",
        )}
      >
        <Layers className="h-3 w-3" />
        All
      </button>
      {CHALLENGE_CATEGORIES.map((cat) => {
        const cfg = CHALLENGE_LIST_CATEGORY_CONFIG[cat];
        const Icon = cfg.icon;
        const isActive = active === cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(isActive ? null : cat)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 font-mono text-[10px] font-semibold transition-all duration-150",
              isActive
                ? `ring-1 text-white`
                : "border border-white/[0.05] text-slate-600 hover:border-white/[0.08] hover:text-slate-400",
            )}
            style={
              isActive
                ? {
                    backgroundColor: `${cfg.color}15`,
                    color: cfg.color,
                    borderColor: `${cfg.color}30`,
                    boxShadow: `0 0 16px ${cfg.color}10`,
                  }
                : {}
            }
          >
            <Icon className="h-3 w-3" />
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}
