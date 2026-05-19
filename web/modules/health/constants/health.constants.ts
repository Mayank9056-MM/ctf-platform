import { AlertTriangle, CheckCircle2, Database, HardDrive, Mail, ServerCrash, Wifi, Zap } from "lucide-react";
import { OverallStatus, ServiceStatus, ValidService } from "../types/health-check.types";

export const SERVICE_ICONS: Record<ValidService, React.ElementType> = {
  mongodb: Database,
  redisCache: Zap,
  redisSession: HardDrive,
  storage: HardDrive,
  email: Mail,
  socket: Wifi,
};

export const SERVICE_LABELS: Record<ValidService, string> = {
  mongodb: "MongoDB",
  redisCache: "Redis Cache",
  redisSession: "Redis Session",
  storage: "S3 Storage",
  email: "SMTP Email",
  socket: "Socket.IO",
};

export const STATUS_CONFIG: Record<
  ServiceStatus,
  { color: string; bg: string; ring: string; dot: string; label: string }
> = {
  [ServiceStatus.HEALTHY]: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
    dot: "bg-emerald-400",
    label: "Healthy",
  },
  [ServiceStatus.DEGRADED]: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
    dot: "bg-amber-400",
    label: "Degraded",
  },
  [ServiceStatus.UNHEALTHY]: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    ring: "ring-red-500/20",
    dot: "bg-red-400",
    label: "Unhealthy",
  },
};

export const OVERALL_CONFIG: Record<
  OverallStatus,
  {
    color: string;
    bg: string;
    border: string;
    label: string;
    Icon: React.ElementType;
  }
> = {
  [OverallStatus.HEALTHY]: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    label: "All Systems Operational",
    Icon: CheckCircle2,
  },
  [OverallStatus.DEGRADED]: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: "Partial Outage",
    Icon: AlertTriangle,
  },
  [OverallStatus.UNHEALTHY]: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Major Outage",
    Icon: ServerCrash,
  },
};
