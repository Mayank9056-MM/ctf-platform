"use client";

import Link from "next/link";
import { ChevronRight, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// Panel

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  /** Animate in on mount with a staggered delay */
  delay?: number;
}

export function Panel({ children, className, delay = 0 }: PanelProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl",
        "border border-white/[0.06] bg-[#0d1117]/80 backdrop-blur-sm",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_8px_32px_rgba(0,0,0,0.4)]",
        "animate-in fade-in slide-in-from-bottom-2",
        className,
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {children}
    </div>
  );
}

// Panel header

interface PanelHeaderProps {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  href?: string;
  hrefLabel?: string;
}

export function PanelHeader({
  icon,
  title,
  badge,
  action,
  href,
  hrefLabel = "View all",
}: PanelHeaderProps) {
  return (
    <div className="flex shrink-0 items-center justify-between px-5 pt-5 pb-4">
      <div className="flex items-center gap-2.5">
        {icon}
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          {title}
        </h2>
        {badge}
      </div>
      <div className="flex items-center gap-3">
        {action}
        {href && (
          <Link
            href={href}
            className="flex items-center gap-0.5 font-mono text-[10px] text-slate-600 transition-colors hover:text-emerald-400"
          >
            {hrefLabel}
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

// Icon wrapper

export function PanelIcon({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {children}
    </div>
  );
}

// Skeleton

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-white/[0.04]", className)}
    />
  );
}

export function SkeletonRow({ wide = false }: { wide?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5">
      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className={cn("h-3", wide ? "w-2/3" : "w-1/2")} />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
      <Skeleton className="h-3 w-12 shrink-0" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
      <div className="flex gap-2">
        <Skeleton className="h-4 w-14 rounded-full" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

// Empty state

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 text-slate-700">{icon}</div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {description && (
        <p className="mt-1 max-w-[200px] text-xs text-slate-700 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Error state

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
      <p className="text-xs text-red-400/80">{message ?? "Failed to load"}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
        >
          <RefreshCcw className="h-3 w-3" /> Retry
        </button>
      )}
    </div>
  );
}

// Live badge

export function LiveBadge({ label = "LIVE" }: { label?: string }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 font-mono text-[9px] text-red-400 ring-1 ring-red-500/20">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
      {label}
    </span>
  );
}

// Divider

export function PanelDivider() {
  return <div className="mx-5 h-px bg-white/[0.05]" />;
}

// Scroll area

export function ScrollArea({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-y-auto",
        // Custom thin scrollbar
        "[&::-webkit-scrollbar]:w-1",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:rounded-full",
        "[&::-webkit-scrollbar-thumb]:bg-white/10",
        "scrollbar-thin",
        className,
      )}
    >
      {children}
    </div>
  );
}
