import { Eye, Globe, Hash, Layers, Lock, Search, Shield, Star, Target, Zap } from "lucide-react";
import { ChallengeCategory, ChallengeDifficulty } from "../../challenges/types/challenge.types";

export const ADMIN_CHALLENGE_DIFF_CONFIG: Record<
  ChallengeDifficulty,
  { label: string; color: string; bg: string; ring: string; bar: string }
> = {
  easy: {
    label: "Easy",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
    bar: "bg-emerald-500",
  },
  medium: {
    label: "Medium",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
    bar: "bg-amber-500",
  },
  hard: {
    label: "Hard",
    color: "text-red-400",
    bg: "bg-red-500/10",
    ring: "ring-red-500/20",
    bar: "bg-red-500",
  },
  insane: {
    label: "Insane",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500/20",
    bar: "bg-violet-500",
  },
};

export const ADMIN_CHALLENGE_CAT_ICONS: Partial<Record<ChallengeCategory, React.ElementType>> = {
  web: Globe,
  crypto: Lock,
  pwn: Zap,
  forensics: Search,
  reversing: Layers,
  misc: Hash,
  osint: Eye,
  blockchain: Shield,
  hardware: Target,
  cloud: Star,
};

 export const PAGE_SIZES = [10, 20, 50];