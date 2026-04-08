"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Info,
  Loader2,
  Megaphone,
  Play,
  Radio,
  Users,
  X,
} from "lucide-react";
import {
  EmptyState,
  ErrorState,
  LiveBadge,
  Panel,
  PanelHeader,
  PanelIcon,
  ScrollArea,
  SkeletonCard,
} from "../ui/widget-shell";
import { useRegisterForEvent } from "@/modules/events/hooks/useRegisterForEvent";
import { cn } from "@/lib/utils";
import { FORMAT_LABELS } from "@/modules/events/constants/event.constants";
import { useUpcomingEvents } from "@/modules/events/hooks/useUpcomingEvents";
import { useLiveEvents } from "@/modules/events/hooks/useLiveEvents";
import { useDismissAnnouncement } from "@/modules/announcement/hooks/useDismissAnnouncement";
import { useAnnouncementFeed } from "@/modules/announcement/hooks/useAnnoucementFeed";
import { EventSummary } from "@/modules/events/types/event.type";
import { AnnouncementFeedItem } from "@/modules/announcement/types/announcement.types";

// EventsWidget

function EventCard({
  event,
  isLive,
}: {
  event: EventSummary;
  isLive: boolean;
}) {
  console.log(event, "event from eventCard");

  const { mutate: register, isPending } = useRegisterForEvent();
  const accent = event?.branding?.accentColor ?? "#10b981";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border transition-all duration-200",
        isLive
          ? "border-red-500/15 bg-red-950/5 hover:border-red-500/25"
          : "border-white/[0.05] bg-white/[0.02] hover:border-white/[0.08]",
      )}
    >
      {/* Accent stripe */}
      <div
        className="absolute bottom-0 left-0 top-0 w-0.5 rounded-l-xl"
        style={{ backgroundColor: accent }}
      />

      <div className="px-4 py-3.5 pl-5">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          {isLive ? (
            <LiveBadge />
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-white/[0.05] px-2 py-0.5 font-mono text-[9px] text-slate-500">
              <Calendar className="h-2.5 w-2.5" /> Soon
            </span>
          )}
          <span className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-slate-500">
            {FORMAT_LABELS[event.format] ?? event.format}
          </span>
        </div>

        <Link
          href={`/events/${event.slug}`}
          className="block truncate text-sm font-semibold text-slate-200 hover:text-emerald-300 transition-colors"
        >
          {event.name}
        </Link>

        {event.branding?.tagline && (
          <p className="mt-0.5 truncate text-[11px] text-slate-600">
            {event.branding.tagline}
          </p>
        )}

        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-mono text-[10px] text-slate-600">
            <span className="flex items-center gap-1">
              <Users className="h-2.5 w-2.5" />
              {event.stats.registeredCount.toLocaleString()}
            </span>
            <span>
              {isLive
                ? `Ends ${formatDistanceToNow(new Date(event.closedAt), { addSuffix: true })}`
                : `Starts ${formatDistanceToNow(new Date(event.opensAt), { addSuffix: true })}`}
            </span>
          </div>

          {event.isRegistered ? (
            <Link
              href={`/events/${event.slug}`}
              className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20 transition-all hover:bg-emerald-500/20"
            >
              <Play className="h-2.5 w-2.5" /> Enter
            </Link>
          ) : (
            <button
              onClick={() => register({ eventId: event._id })}
              disabled={isPending}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-[10px] font-semibold transition-all",
                isLive
                  ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  : "border border-white/[0.08] text-slate-400 hover:border-white/[0.15] hover:text-white",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isLive ? (
                <>
                  <Play className="h-2.5 w-2.5" /> Join
                </>
              ) : (
                "Register"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventsWidget() {
  const {
    data: liveEvents,
    isLoading: loadingLive,
    refetch: refetchLive,
  } = useLiveEvents();
  const { data: upcoming, isLoading: loadingUpcoming } = useUpcomingEvents();

  const isLoading = loadingLive || loadingUpcoming;
  const hasAny =
    (liveEvents?.events?.length ?? 0) > 0 ||
    (upcoming?.events?.length ?? 0) > 0;

  // Normalise — both hooks return { data: { events } }
  const live = liveEvents?.events ?? [];
  const soon = upcoming?.events ?? [];
  const showAny = live.length > 0 || soon.length > 0;

  return (
    <Panel>
      <PanelHeader
        icon={
          <PanelIcon color="#ef4444">
            <Radio className="h-3.5 w-3.5" />
          </PanelIcon>
        }
        title="Events"
        href="/events"
        badge={
          live.length > 0 ? (
            <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-1.5 py-0.5 font-mono text-[9px] text-red-400">
              <span className="h-1 w-1 animate-pulse rounded-full bg-red-400" />
              {live.length} live
            </span>
          ) : undefined
        }
      />

      <ScrollArea className="flex-1 px-4 pb-4">
        <div className="space-y-2.5">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : !showAny ? (
            <EmptyState
              icon={<Radio className="h-9 w-9" />}
              title="No active events"
              description="Check back soon for competitions"
            />
          ) : (
            <>
              {live.map((e) => (
                <EventCard key={e._id} event={e} isLive />
              ))}
              {soon.map((e) => (
                <EventCard key={e._id} event={e} isLive={false} />
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </Panel>
  );
}

// AnnouncementsWidget

const SEV_CFG = {
  info: {
    icon: Info,
    color: "#60a5fa",
    ring: "ring-blue-500/15",
    bg: "bg-blue-500/5",
  },
  success: {
    icon: CheckCircle2,
    color: "#34d399",
    ring: "ring-emerald-500/15",
    bg: "bg-emerald-500/5",
  },
  warning: {
    icon: AlertTriangle,
    color: "#fbbf24",
    ring: "ring-amber-500/15",
    bg: "bg-amber-500/5",
  },
  critical: {
    icon: AlertCircle,
    color: "#f87171",
    ring: "ring-red-500/20",
    bg: "bg-red-500/8",
  },
} as const;

function AnnouncementCard({ item }: { item: AnnouncementFeedItem }) {
  const { mutate: dismiss, isPending } = useDismissAnnouncement();
  const cfg = SEV_CFG[item.severity as keyof typeof SEV_CFG] ?? SEV_CFG.info;
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "group relative rounded-xl border p-4 transition-all duration-200",
        cfg.bg,
        cfg.ring,
      )}
    >
      <button
        onClick={() => dismiss(item._id)}
        disabled={isPending}
        className="absolute right-3 top-3 rounded p-0.5 text-slate-600 opacity-0 transition-all group-hover:opacity-100 hover:text-slate-400"
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <X className="h-3 w-3" />
        )}
      </button>

      <div className="flex items-start gap-3 pr-5">
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span
              className="font-mono text-[9px] uppercase tracking-widest"
              style={{ color: cfg.color }}
            >
              {item.severity}
            </span>
            {item.challenge && (
              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] text-slate-500">
                {item.challenge.title}
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-white leading-snug">
            {item.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 leading-relaxed">
            {item.body}
          </p>

          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[9px] text-slate-700">
              {item.publishedAt
                ? formatDistanceToNow(new Date(item.publishedAt), {
                    addSuffix: true,
                  })
                : "-"}
            </span>
            {item.actionUrl && (
              <a
                href={item.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] transition-colors"
                style={{ color: cfg.color }}
              >
                {item.actionLabel ?? "View →"}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnnouncementsWidget() {
  const { announcements, meta, isLoading, isError, refetch } =
    useAnnouncementFeed();

  return (
    <Panel>
      <PanelHeader
        icon={
          <PanelIcon color="#fbbf24">
            <Megaphone className="h-3.5 w-3.5" />
          </PanelIcon>
        }
        title="Announcements"
        href="/announcements"
      />

      <ScrollArea className="flex-1 px-4 pb-4">
        <div className="space-y-2.5">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : announcements.length === 0 ? (
            <EmptyState
              icon={<Megaphone className="h-9 w-9" />}
              title="No announcements"
              description="Platform updates will appear here"
            />
          ) : (
            announcements.map((a) => <AnnouncementCard key={a._id} item={a} />)
          )}
        </div>
      </ScrollArea>
    </Panel>
  );
}
