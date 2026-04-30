import { Flame, Shield, Skull, Swords, Target } from "lucide-react";
import { StoryDifficulty } from "../types/story.types";

 
const DIFF_CONFIG: Record<
  StoryDifficulty,
  {
    label: string;
    color: string;
    bg: string;
    ring: string;
    icon: React.ElementType;
    glow: string;
  }
> = {
  beginner: {
    label: "Beginner",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
    icon: Shield,
    glow: "shadow-emerald-500/20",
  },
  easy: {
    label: "Easy",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    ring: "ring-cyan-500/20",
    icon: Target,
    glow: "shadow-cyan-500/20",
  },
  medium: {
    label: "Medium",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
    icon: Swords,
    glow: "shadow-amber-500/20",
  },
  hard: {
    label: "Hard",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    ring: "ring-orange-500/20",
    icon: Flame,
    glow: "shadow-orange-500/20",
  },
  insane: {
    label: "Insane",
    color: "text-red-400",
    bg: "bg-red-500/10",
    ring: "ring-red-500/20",
    icon: Skull,
    glow: "shadow-red-500/20",
  },
};
 
const STATUS_FILTERS = [
  { value: "all", label: "All Stories" },
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
] as const;
 
const DIFF_FILTERS: { value: StoryDifficulty | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "beginner", label: "Beginner" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "insane", label: "Insane" },
];
 
export { DIFF_CONFIG, STATUS_FILTERS, DIFF_FILTERS };