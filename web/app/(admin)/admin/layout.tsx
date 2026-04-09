"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Terminal,
  LayoutDashboard,
  Users,
  Shield,
  ScrollText,
  Trophy,
  Swords,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Crown,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useIsHydrated } from "@/modules/auth/store/auth.store";

// Navigation Config

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Challenges", href: "/admin/challenges", icon: Swords },
      { label: "Events", href: "/admin/events", icon: CalendarDays },
      { label: "Stories", href: "/admin/stories", icon: BookOpen },
      { label: "Submissions", href: "/admin/submissions", icon: Trophy },
      { label: "Teams", href: "/admin/teams", icon: Shield },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Announcements", href: "/admin/announcements", icon: Bell },
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
      { label: "Admin Accounts", href: "/admin/admins", icon: Crown },
    ],
  },
];

// Access Denied

/**
 * A component that displays an access denied page.
 *
 * This component is shown when a user without permission tries to access the admin panel.
 *
 * It contains a red alert triangle icon, a heading, a paragraph explaining the situation, and two buttons: one to go to the dashboard and one to sign in.
 */
function AccessDenied() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-5 max-w-sm"
      >
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/30">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Access Denied
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            You don&apos;t have permission to access the admin panel. This
            incident has been logged.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push("/login")}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:border-slate-500 transition-colors"
          >
            Sign in
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Nav Item

/**
 * A navigation item component.
 *
 * @param {Object} item - The navigation item to render, which should have the following properties:
 *   label: The label of the navigation item.
 *   href: The href of the navigation item.
 *   icon: The icon element of the navigation item.
 *   exact?: Whether the navigation item should be active if the current pathname is exactly equal to the item's href.
 * @param {boolean} collapsed - Whether the navigation item should be collapsed.
 * @param {Function} onClick - The onClick handler for the navigation item.
 * @return {ReactElement} The rendered navigation item element.
 */
function NavItem({
  item,
  collapsed,
  onClick,
}: {
  item: {
    label: string;
    href: string;
    icon: React.ElementType;
    exact?: boolean;
  };
  collapsed: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
        active
          ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active && "text-emerald-400")} />
      {!collapsed && (
        <span className="truncate font-mono text-[13px] tracking-wide">
          {item.label}
        </span>
      )}
      {!collapsed && active && (
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
      )}
    </Link>
  );
}

// Sidebar

/**
 * A sidebar component for the CTF admin panel.
 *
 * @param {boolean} collapsed - Whether the sidebar is collapsed.
 * @param {() => void} onToggle - A callback to toggle the sidebar collapse state.
 * @param {{ username: string, role: string, email: string } | null} user - The user's info.
 * @param {() => void} [onMobileClose] - A callback to close the mobile sidebar.
 * @param {boolean} [isMobile=false] - Whether the sidebar is rendered on a mobile device.
 */
function Sidebar({
  collapsed,
  onToggle,
  user,
  onMobileClose,
  isMobile = false,
}: {
  collapsed: boolean;
  onToggle: () => void;
  user: { username?: string; role?: string; email?: string } | null;
  onMobileClose?: () => void;
  isMobile?: boolean;
}) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-[#070d1a] border-r border-slate-800/70",
        collapsed ? "w-[60px]" : "w-[220px]",
        "transition-all duration-200",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-slate-800/70 px-4",
          collapsed && "justify-center px-2",
        )}
      >
        {!collapsed ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <span className="font-mono text-sm font-semibold text-white truncate">
              CTF<span className="text-emerald-400">Admin</span>
            </span>
          </div>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 ring-1 ring-emerald-500/30">
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="space-y-0.5">
            {!collapsed && (
              <p className="px-3 pb-1 font-mono text-[10px] tracking-[0.2em] text-slate-600 uppercase">
                {section.label}
              </p>
            )}
            {section.items.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                collapsed={collapsed}
                onClick={isMobile ? onMobileClose : undefined}
              />
            ))}
          </div>
        ))}
      </div>

      {/* User + collapse */}
      <div className="border-t border-slate-800/70 p-2 space-y-1">
        {/* User info */}
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 bg-slate-900/40">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <span className="font-mono text-[10px] text-emerald-400">
                {(user.username ?? user.email ?? "A").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">
                {user.username ?? user.email}
              </p>
              <p
                className={cn(
                  "text-[10px] font-mono uppercase tracking-wider",
                  user.role === "superadmin"
                    ? "text-amber-400"
                    : "text-emerald-400/70",
                )}
              >
                {user.role}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-500",
            "hover:bg-slate-800/60 hover:text-red-400 transition-colors",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <span className="font-mono text-[13px]">Sign out</span>
          )}
        </button>

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={onToggle}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600",
              "hover:bg-slate-800/60 hover:text-slate-300 transition-colors",
              collapsed && "justify-center px-2",
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="font-mono text-[13px]">Collapse</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// Admin Layout

/**
 * AdminLayout is a layout component that wraps the admin pages.
 * It provides a sidebar for desktop and a mobile topbar with a sidebar overlay.
 * It also performs a role guard and only allows authenticated admins to access the content.
 * @param {React.ReactNode} children - The content to be rendered inside the layout.
 * @returns {React.ReactElement} - The rendered layout component.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHydrated = useIsHydrated();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Loading state
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-emerald-500/50 animate-bounce"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
          <p className="font-mono text-xs text-slate-600">
            Loading admin panel...
          </p>
        </div>
      </div>
    );
  }

  // Role guard
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  if (!isAuthenticated || !isAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="flex h-screen bg-[#050810] overflow-hidden">
      {/* ── Desktop sidebar ── */}
      <div className="hidden lg:flex h-full flex-shrink-0">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          user={user}
        />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar
                collapsed={false}
                onToggle={() => {}}
                user={user}
                onMobileClose={() => setMobileOpen(false)}
                isMobile
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="flex lg:hidden h-14 items-center gap-3 border-b border-slate-800/70 bg-[#070d1a] px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <Terminal className="h-3 w-3 text-emerald-400" />
            </div>
            <span className="font-mono text-sm font-semibold text-white">
              CTF<span className="text-emerald-400">Admin</span>
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
