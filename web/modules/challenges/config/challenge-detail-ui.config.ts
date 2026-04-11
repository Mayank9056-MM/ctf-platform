import {
  Binary,
  Cloud,
  Cpu,
  FileSearch,
  Fingerprint,
  Globe,
  Hash,
  Layers,
  Lock,
  Swords,
} from "lucide-react";
import {
  ChallengeCategory,
  ChallengeDifficulty,
} from "../types/challenge.types";

export const CHALLENGE_DETAIL_CATEGORY_CONFIG: Record<
  ChallengeCategory,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  web: { icon: Globe, color: "#34d399", bg: "bg-emerald-500/10", label: "Web" },
  pwn: { icon: Swords, color: "#f87171", bg: "bg-red-500/10", label: "Pwn" },
  crypto: {
    icon: Lock,
    color: "#a78bfa",
    bg: "bg-violet-500/10",
    label: "Crypto",
  },
  forensics: {
    icon: FileSearch,
    color: "#60a5fa",
    bg: "bg-blue-500/10",
    label: "Forensics",
  },
  reversing: {
    icon: Binary,
    color: "#fb923c",
    bg: "bg-orange-500/10",
    label: "Rev",
  },
  misc: { icon: Hash, color: "#94a3b8", bg: "bg-slate-500/10", label: "Misc" },
  osint: {
    icon: Fingerprint,
    color: "#f472b6",
    bg: "bg-pink-500/10",
    label: "OSINT",
  },
  blockchain: {
    icon: Layers,
    color: "#38bdf8",
    bg: "bg-sky-500/10",
    label: "Chain",
  },
  hardware: {
    icon: Cpu,
    color: "#4ade80",
    bg: "bg-green-500/10",
    label: "Hardware",
  },
  cloud: { icon: Cloud, color: "#7dd3fc", bg: "bg-sky-400/10", label: "Cloud" },
};

export const CHALLENGE_DETAIL_DIFF_CONFIG: Record<
  ChallengeDifficulty,
  { color: string; label: string; bars: number }
> = {
  easy: { color: "#34d399", label: "Easy", bars: 1 },
  medium: { color: "#fbbf24", label: "Medium", bars: 2 },
  hard: { color: "#f97316", label: "Hard", bars: 3 },
  insane: { color: "#f87171", label: "INSANE", bars: 4 },
};
