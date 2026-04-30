import { StoryDifficulty } from "../types/story.types";
import { Brain, Flame, GitBranch, MessageSquare, Shield, Skull, Swords, Target, Terminal } from "lucide-react";

const DIFF_CONFIG: Record<
  StoryDifficulty,
  { label: string; color: string; bg: string; ring: string; icon: React.ElementType }
> = {
  beginner: { label: "Beginner", color: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20", icon: Shield },
  easy: { label: "Easy", color: "text-cyan-400", bg: "bg-cyan-500/10", ring: "ring-cyan-500/20", icon: Target },
  medium: { label: "Medium", color: "text-amber-400", bg: "bg-amber-500/10", ring: "ring-amber-500/20", icon: Swords },
  hard: { label: "Hard", color: "text-orange-400", bg: "bg-orange-500/10", ring: "ring-orange-500/20", icon: Flame },
  insane: { label: "Insane", color: "text-red-400", bg: "bg-red-500/10", ring: "ring-red-500/20", icon: Skull },
};
 
const NODE_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  challenge: { label: "Challenge", icon: Terminal, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  cutscene: { label: "Cutscene", icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10" },
  briefing: { label: "Briefing", icon: Brain, color: "text-violet-400", bg: "bg-violet-500/10" },
  choice: { label: "Choice", icon: GitBranch, color: "text-amber-400", bg: "bg-amber-500/10" },
};

export { DIFF_CONFIG, NODE_TYPE_CONFIG };