"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Loader2,
  Megaphone,
  Shield,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  EmptyState,
  ErrorState,
  Panel,
  PanelHeader,
  PanelIcon,
  ScrollArea,
  SkeletonRow,
} from "../ui/widget-shell";
import { NotificationTypeValue } from "@/modules/notification/types/notification.types";
import { cn } from "@/lib/utils";
import { useInboxSummary } from "@/modules/notification/hooks/useInboxSummary";
import { useDeleteNotification } from "@/modules/notification/hooks/useDeleteNotification";
import { useClearInbox } from "@/modules/notification/hooks/useClearInbox";
import { useMarkNotificationsAsRead } from "@/modules/notification/hooks/useMarkNotificationAsRead";

// Type -> icon config

const TYPE_CFG: Partial<
  Record<NotificationTypeValue, { icon: React.ElementType; color: string }>
> = {
  submission_correct: { icon: Check, color: "#34d399" },
  submission_first_blood: { icon: Zap, color: "#ef4444" },
  team_invite_received: { icon: Users, color: "#60a5fa" },
  team_invite_accepted: { icon: Users, color: "#34d399" },
  team_invite_declined: { icon: Users, color: "#f87171" },
  team_challenge_solved: { icon: Trophy, color: "#f59e0b" },
  admin_announcement: { icon: Megaphone, color: "#fbbf24" },
  account_banned: { icon: Shield, color: "#ef4444" },
};

function getTypeCfg(type: string) {
  return (
    TYPE_CFG[type as NotificationTypeValue] ?? { icon: Bell, color: "#64748b" }
  );
}

// Single row

function NotifRow({
  item,
  onRead,
  onDelete,
}: {
  item: {
    _id: string;
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
  };
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { icon: Icon, color } = getTypeCfg(item.type);

  const inner = (
    <div
      className={cn(
        "group/row flex items-start gap-3 px-4 py-3 transition-all duration-150 cursor-pointer",
        "hover:bg-white/[0.03]",
        !item.isRead && "bg-emerald-950/10",
      )}
      onClick={() => !item.isRead && onRead(item._id)}
    >
      {/* Icon + unread dot */}
      <div className="relative mt-0.5 shrink-0">
        {!item.isRead && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0d1117]" />
        )}
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "line-clamp-1 text-sm leading-snug",
            item.isRead ? "text-slate-500" : "font-medium text-slate-200",
          )}
        >
          {item.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-600">
          {item.body}
        </p>
        <span className="mt-1 block font-mono text-[9px] text-slate-700">
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onDelete(item._id);
        }}
        className="mt-0.5 shrink-0 rounded p-0.5 text-slate-700 opacity-0 transition-all hover:text-slate-400 group-hover/row:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );

  if (item.actionUrl) {
    return (
      <Link href={item.actionUrl} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

// Main

export function NotificationsWidget() {
  const { data: summary, isLoading, isError, refetch } = useInboxSummary();
  const { mutate: markRead } = useMarkNotificationsAsRead();
  const { mutate: deleteNotif } = useDeleteNotification();
  const { mutate: clearAll, isPending: isClearing } = useClearInbox();

  const notifications = summary?.latestNotifications ?? [];
  const unread = summary?.unreadCount ?? 0;

  return (
    <Panel>
      <PanelHeader
        icon={
          <div className="relative">
            <PanelIcon color="#94a3b8">
              <Bell className="h-3.5 w-3.5" />
            </PanelIcon>
            {unread > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 font-mono text-[9px] font-bold text-slate-950">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </div>
        }
        title="Notifications"
        href="/notifications"
        action={
          unread > 0 ? (
            <button
              onClick={() => markRead([])}
              className="text-[10px] text-slate-700 hover:text-emerald-400 transition-colors"
              title="Mark all read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
            </button>
          ) : undefined
        }
      />

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="space-y-0.5 pb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<BellOff className="h-9 w-9" />}
            title="All caught up!"
            description="No new notifications"
          />
        ) : (
          <div className="pb-2">
            {notifications.map((n) => (
              <NotifRow
                key={n._id}
                item={n}
                onRead={(id) => markRead([id])}
                onDelete={(id) => deleteNotif(id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {notifications.length > 0 && (
        <div className="shrink-0 border-t border-white/[0.04] px-4 py-3">
          <button
            onClick={() => clearAll()}
            disabled={isClearing}
            className="flex w-full items-center justify-center gap-1.5 font-mono text-[10px] text-slate-700 transition-colors hover:text-red-400 disabled:opacity-40"
          >
            {isClearing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
            Clear inbox
          </button>
        </div>
      )}
    </Panel>
  );
}
