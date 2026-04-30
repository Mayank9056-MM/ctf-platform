import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { AnnouncementSeverity } from "../types/announcement.types";

export const SEV: Record<AnnouncementSeverity, {
  icon: React.ElementType;
  color: string; cardBorder: string; cardBg: string; glow: string;
  badgeBg: string; badgeText: string; badgeRing: string;
  accentBar: string; label: string;
}> = {
  info: {
    icon: Info,
    color: "#60a5fa",
    cardBorder: "border-sky-500/15",
    cardBg: "bg-sky-950/10",
    glow: "shadow-[0_0_30px_rgba(96,165,250,0.04)]",
    badgeBg: "bg-sky-500/10", badgeText: "text-sky-400", badgeRing: "ring-sky-500/20",
    accentBar: "bg-sky-500",
    label: "Info",
  },
  success: {
    icon: CheckCircle2,
    color: "#34d399",
    cardBorder: "border-emerald-500/15",
    cardBg: "bg-emerald-950/10",
    glow: "shadow-[0_0_30px_rgba(52,211,153,0.04)]",
    badgeBg: "bg-emerald-500/10", badgeText: "text-emerald-400", badgeRing: "ring-emerald-500/20",
    accentBar: "bg-emerald-500",
    label: "Update",
  },
  warning: {
    icon: AlertTriangle,
    color: "#fbbf24",
    cardBorder: "border-amber-500/20",
    cardBg: "bg-amber-950/10",
    glow: "shadow-[0_0_30px_rgba(251,191,36,0.05)]",
    badgeBg: "bg-amber-500/10", badgeText: "text-amber-400", badgeRing: "ring-amber-500/20",
    accentBar: "bg-amber-500",
    label: "Warning",
  },
  critical: {
    icon: AlertCircle,
    color: "#f87171",
    cardBorder: "border-red-500/25",
    cardBg: "bg-red-950/10",
    glow: "shadow-[0_0_30px_rgba(248,113,113,0.07)]",
    badgeBg: "bg-red-500/10", badgeText: "text-red-400", badgeRing: "ring-red-500/25",
    accentBar: "bg-red-500",
    label: "Critical",
  },
};