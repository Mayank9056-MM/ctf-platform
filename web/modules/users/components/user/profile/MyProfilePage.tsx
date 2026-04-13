"use client";

import { useUser } from "@/modules/auth/store/auth.store";
import { useMyStats } from "@/modules/submissions/hooks/useMyStats";
import { Activity, Pencil, Shield } from "lucide-react";
import { useState } from "react";
import { ProfileHero } from "./ProfileHero";
import { Ambient } from "./Ambient";
import { UserProfile } from "@/modules/users/types/user.types";
import { OverviewTab } from "./OverviewTab";
import { EditProfileTab } from "./EditProfileTab";
import { SecurityTab } from "./SecurityTab";
import { cn } from "@/lib/utils";

type Tab = "overview" | "edit" | "security";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "edit", label: "Edit", icon: Pencil },
  { id: "security", label: "Security", icon: Shield },
];

// Main page

export default function MyProfilePage() {
  const [tab, setTab] = useState<Tab>("overview");
  const user = useUser();
  const { data: stats } = useMyStats();

  if (!user) return null;

  return (
    <>
      <Ambient />
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="space-y-5">
          {/* Hero */}
          <ProfileHero user={user as UserProfile} stats={stats} />

          {/* Tabs */}
          <div
            className="flex gap-1 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-1 animate-in fade-in duration-500"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 font-mono text-xs font-medium transition-all duration-150",
                  tab === id
                    ? "bg-white/[0.07] text-slate-200"
                    : "text-slate-600 hover:text-slate-400",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>

          {/* Tab panels */}
          <div className="animate-in fade-in duration-300">
            {tab === "overview" && (
              <OverviewTab user={user as UserProfile} stats={stats} />
            )}
            {tab === "edit" && <EditProfileTab user={user as UserProfile} />}
            {tab === "security" && <SecurityTab user={user as UserProfile} />}
          </div>
        </div>
      </div>
    </>
  );
}
