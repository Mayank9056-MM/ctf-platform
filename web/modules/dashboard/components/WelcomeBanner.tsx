"use client";

import Link from "next/link";
import { useUser } from "@/modules/auth/store/auth.store";
import { ChevronRight, ShieldCheck, Target, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Burning midnight oil?";
}

export function WelcomeBanner() {
  const user = useUser();
  const greeting = getGreeting();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.06]",
        "bg-gradient-to-br from-[#0d1117] via-[#0d1117] to-emerald-950/20",
        "px-6 py-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_8px_32px_rgba(0,0,0,0.4)]",
        "animate-in fade-in slide-in-from-bottom-2",
      )}
    >
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/8 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-5">
        {/* Left */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/25">
              <Terminal className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="font-mono text-[10px] tracking-[0.22em] text-emerald-500/70 uppercase">
              // CTF Platform
            </span>
          </div>

          <h1 className="text-xl font-bold text-white">
            {greeting},{" "}
            <span className="font-mono text-emerald-400">
              {user?.username ?? "hacker"}
            </span>
            .
          </h1>

          {user && !user.isVerified && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <p className="text-xs text-amber-300">
                Verify your email to unlock all features.{" "}
                <Link
                  href="/settings/account"
                  className="underline underline-offset-2 hover:text-amber-200 transition-colors"
                >
                  Resend
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/challenges"
            className={cn(
              "flex items-center gap-2 rounded-xl border border-emerald-500/30",
              "bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300",
              "transition-all hover:bg-emerald-500/20 hover:border-emerald-500/50",
              "hover:shadow-[0_0_20px_rgba(52,211,153,0.12)]",
            )}
          >
            <Target className="h-4 w-4" />
            Solve Challenges
          </Link>
          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-white/[0.12] hover:text-white"
          >
            Leaderboard
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
