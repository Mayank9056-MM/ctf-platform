import { Binary, Cloud, Cpu, FileSearch, Fingerprint, Globe, Hash, Layers, Lock, Swords } from "lucide-react";
import { ChallengeCategory, ChallengeDifficulty } from "../types/challenge.types";

export type CatConfig = {
  icon: React.ElementType;
  color: string;
  bg: string;
  label: string;
};

export const CHALLENGE_LIST_CATEGORY_CONFIG: Record<ChallengeCategory, CatConfig> = {
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

// Difficulty config

export type DiffConfig = {
  color: string;
  bg: string;
  ring: string;
  label: string;
  bars: number;
};

export const DIFF_CONFIG: Record<ChallengeDifficulty, DiffConfig> = {
  easy: {
    color: "#34d399",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
    label: "Easy",
    bars: 1,
  },
  medium: {
    color: "#fbbf24",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
    label: "Medium",
    bars: 2,
  },
  hard: {
    color: "#f97316",
    bg: "bg-orange-500/10",
    ring: "ring-orange-500/20",
    label: "Hard",
    bars: 3,
  },
  insane: {
    color: "#f87171",
    bg: "bg-red-500/10",
    ring: "ring-red-500/20",
    label: "INSANE",
    bars: 4,
  },
};
