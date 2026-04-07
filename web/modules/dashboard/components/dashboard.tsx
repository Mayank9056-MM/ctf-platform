"use client";

import { Suspense } from "react";
import { WidgetSkeleton } from "./widgets/WidgetSkeleton";
import { StatsSkeleton } from "./skeletons/statsSkeleton";
import { WelcomeBanner } from "./WelcomeBanner";
import { StatsWidget } from "./widgets/StatsWidget";
import {
  AnnouncementsWidget,
  EventsWidget,
} from "./widgets/EventsAndAnnouncementsWidgets";
import {
  LeaderboardWidget,
  TeamWidget,
} from "./widgets/LeaderboardAndTeamWidgets";
import { NotificationsWidget } from "./widgets/NotificationsWidget";

export default function DashboardPage() {
  return (
    <>
      {/* Fixed ambient glow — scoped to dashboard */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.012]"
        style={{
          backgroundImage:
            "linear-gradient(#00ff88 1px,transparent 1px),linear-gradient(90deg,#00ff88 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed right-0 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/4 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-cyan-500/3 blur-[100px]"
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-screen-2xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
        <WelcomeBanner />

        <Suspense fallback={<StatsSkeleton />}>
          <StatsWidget />
        </Suspense>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.85fr_0.6fr] xl:grid-cols-[1fr_0.8fr_0.55fr]">
          <div className="flex flex-col gap-5">
            <div className="min-h-[320px]">
              <Suspense fallback={<WidgetSkeleton />}>
                <EventsWidget />
              </Suspense>
            </div>
            <div className="min-h-[260px]">
              <Suspense fallback={<WidgetSkeleton />}>
                <AnnouncementsWidget />
              </Suspense>
            </div>
          </div>

          <div className="min-h-[620px]">
            <Suspense fallback={<WidgetSkeleton />}>
              <LeaderboardWidget />
            </Suspense>
          </div>

          <div className="flex flex-col gap-5">
            <div className="min-h-[280px]">
              <Suspense fallback={<WidgetSkeleton />}>
                <NotificationsWidget />
              </Suspense>
            </div>
            <div className="min-h-[340px]">
              <Suspense fallback={<WidgetSkeleton />}>
                <TeamWidget />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
