"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  ChevronDown,
  Command,
  Crown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Terminal,
  X,
} from "lucide-react";
import { ConnectionIndicator } from "@/shared/components/ConnectionIndicator";
import {
  NAV_ITEMS,
  USER_DROPDOWN_FOOTER,
  USER_DROPDOWN_ITEMS,
} from "../lib/navbar.config";
import { useNavbar } from "../hooks/useNavbar";
import { DropdownItem, NavItem } from "../types/navbar.types";
import { cn } from "@/lib/utils";

// NavLink

/**
 * A custom Link component for navigation items.
 *
 * @param {NavItem} item - The navigation item to render.
 * @param {boolean} isActive - Whether the item is active or not.
 * @param {number} [liveCount] - The count of live events if the item is an events link.
 * @returns {ReactElement} A custom Link component.
 */
function NavLink({
  item,
  isActive,
  liveCount,
}: {
  item: NavItem;
  isActive: boolean;
  liveCount?: number;
}) {
  const Icon = item.icon;
  const showLive = item.href === "/events" && (liveCount ?? 0) > 0;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-emerald-500/10 text-emerald-300"
          : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200",
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-emerald-400" />
      )}
      <Icon
        className={cn(
          "h-4 w-4 transition-colors",
          isActive
            ? "text-emerald-400"
            : "text-slate-600 group-hover:text-slate-300",
        )}
      />
      {item.label}
      {showLive && (
        <span className="flex items-center gap-0.5 rounded-full bg-red-500/15 px-1.5 py-0.5 font-mono text-[9px] text-red-400 ring-1 ring-red-500/20">
          <span className="h-1 w-1 animate-pulse rounded-full bg-red-400" />
          {liveCount}
        </span>
      )}
    </Link>
  );
}

// Bell

/**
 * A notification bell component.
 *
 * @param {Object} props - Component props
 * @param {number} props.count - The number of unread notifications
 * @returns {React.ReactElement} A notification bell component
 */
function NotifBell({ count }: { count: number }) {
  return (
    <Link
      href="/notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-slate-400 transition-all hover:border-white/[0.1] hover:bg-white/[0.06] hover:text-slate-200"
      aria-label={`${count} unread notifications`}
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 font-mono text-[9px] font-bold text-slate-950 ring-2 ring-[#080c10]">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

// Search trigger

/**
 * A search trigger button that expands to show a dropdown menu when clicked.
 * @param {function} onClick - The callback function when the button is clicked.
 */
function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hidden items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-slate-600 transition-all hover:border-white/[0.1] hover:bg-white/[0.06] hover:text-slate-400 xl:flex"
      aria-label="Search (Ctrl+K)"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="font-mono text-xs">Search…</span>
      <kbd className="ml-1 flex items-center gap-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-slate-600">
        <Command className="h-2.5 w-2.5" />K
      </kbd>
    </button>
  );
}

// User button

/**
 * A button that displays the user's avatar and username.
 * When clicked, it expands to show a dropdown menu.
 *
 * @param {object} user - The user object, containing `avatar` and `username`.
 * @param {boolean} isOpen - Whether the dropdown menu is open.
 * @param {function} onClick - The callback function when the button is clicked.
 */
function UserButton({
  user,
  isOpen,
  onClick,
}: {
  user: NonNullable<ReturnType<typeof useNavbar>["user"]>;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 transition-all duration-200",
        isOpen
          ? "border-emerald-500/30 bg-emerald-950/20"
          : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.1] hover:bg-white/[0.05]",
      )}
      aria-expanded={isOpen}
      aria-label="User menu"
    >
      <div className="relative h-7 w-7 overflow-hidden rounded-lg bg-white/[0.08] ring-1 ring-white/[0.1]">
        {user?.avatar?.url ? (
          <Image
            src={user?.avatar.url}
            alt={user?.username}
            fill
            className="object-cover"
            sizes="28px"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-mono text-[10px] font-semibold text-slate-300">
            {user?.username.slice(0, 2).toUpperCase() || "?"}
          </span>
        )}
      </div>
      <span className="hidden max-w-[96px] truncate font-mono text-[11px] font-medium text-slate-300 sm:block">
        {user?.username || "Guest"}
      </span>
      <ChevronDown
        className={cn(
          "h-3.5 w-3.5 text-slate-600 transition-transform duration-200",
          isOpen && "rotate-180",
        )}
      />
    </button>
  );
}

// Dropdown item

/**
 * A dropdown menu item.
 *
 * @param {DropdownItem} item - The item to render. Must contain a label and can optionally contain an icon, description, and href.
 * @param {function} onClose - A function to call when the user clicks outside of the dropdown menu.
 *
 * @returns {ReactElement} A React element representing the dropdown menu item.
 */
function DropdownMenuItem({
  item,
  onClose,
}: {
  item: DropdownItem;
  onClose: () => void;
}) {
  const Icon = item.icon;
  const inner = (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-300">{item.label}</p>
        {item.description && (
          <p className="truncate text-[11px] text-slate-600">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className="flex items-center rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.04]"
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      onClick={() => {
        item.onClick?.();
        onClose();
      }}
      className="flex w-full items-center rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.04]"
    >
      {inner}
    </button>
  );
}

// Admin Panel Link

/**
 * A link to the admin panel.
 *
 * This component is only shown inside the dropdown / mobile menu when the user's role is "admin" or "superadmin".
 *
 * @param {string} role - The user's role.
 * @param {function} onClose - A function to close the dropdown / mobile menu.
 * @returns {ReactElement} A link to the admin panel.
 */
function AdminPanelLink({
  role,
  onClose,
}: {
  role: string;
  onClose: () => void;
}) {
  const isSuperAdmin = role === "superadmin";

  return (
    <Link
      href="/admin"
      onClick={onClose}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-amber-500/[0.06]"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
        {isSuperAdmin ? (
          <Crown className="h-3.5 w-3.5 text-amber-400" />
        ) : (
          <LayoutDashboard className="h-3.5 w-3.5 text-amber-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-amber-300 group-hover:text-amber-200 transition-colors">
          Admin Dashboard
        </p>
        <p className="text-[11px] text-slate-600 capitalize">{role}</p>
      </div>
    </Link>
  );
}

// User dropdown

/**
 * User dropdown component
 *
 * @param {NonNullable<ReturnType<typeof useNavbar>["user"]>} user - The user object from the navbar context
 * @param {boolean} isOpen - Whether the menu is open or not
 * @param {React.RefObject<HTMLDivElement | null>} menuRef - The ref object for the menu container
 * @param {() => void} onClose - A callback function to close the menu
 * @param {() => void} onLogout - A callback function to sign out the user
 * @param {boolean} isLoggingOut - Whether the user is logging out or not
 */
function UserDropdown({
  user,
  isOpen,
  menuRef,
  onClose,
  onLogout,
  isLoggingOut,
}: {
  user: NonNullable<ReturnType<typeof useNavbar>["user"]>;
  isOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}) {
  if (!isOpen) return null;

  const isAdmin = user.role === "admin" || user.role === "superadmin";

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full z-50 mt-2 w-64 animate-in fade-in slide-in-from-top-2 duration-150 rounded-2xl border border-white/[0.07] bg-[#0d1117]/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
    >
      {/* Header: avatar + username + email + role badge + score */}
      <div className="border-b border-white/[0.05] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/[0.08] ring-1 ring-white/[0.1]">
            {user.avatar?.url ? (
              <Image
                src={user?.avatar?.url || ""}
                alt={user?.username || "avatar"}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-mono text-sm font-semibold text-slate-300">
                {user?.username?.slice(0, 2)?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-sm font-semibold text-white">
              {user?.username || "anonymous"}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 font-mono text-[9px] font-medium ring-1",
                  isAdmin
                    ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
                )}
              >
                {user.role ?? "player"}
              </span>
              {!user.isVerified && (
                <span className="rounded-full bg-orange-500/10 px-1.5 py-0.5 font-mono text-[9px] text-orange-400 ring-1 ring-orange-500/20">
                  unverified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score strip */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.03] px-3 py-2.5">
          <div className="text-center">
            <p className="font-mono text-base font-bold tabular-nums text-white">
              {(user.score ?? 0).toLocaleString()}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-slate-600">
              Score
            </p>
          </div>
          <div className="h-6 w-px bg-white/[0.06]" />
          <div className="text-center">
            <p className="font-mono text-base font-bold tabular-nums text-white">
              {user.solvedChallenges?.length ?? 0}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-slate-600">
              Solved
            </p>
          </div>
          <div className="h-6 w-px bg-white/[0.06]" />
          <Link
            href="/profile"
            onClick={onClose}
            className="font-mono text-[10px] text-emerald-400 transition-colors hover:text-emerald-300"
          >
            Profile →
          </Link>
        </div>
      </div>

      {/* Admin panel link — only for admin / superadmin */}
      {isAdmin && (
        <div className="border-b border-white/[0.05] px-2 py-2">
          <AdminPanelLink role={user.role!} onClose={onClose} />
        </div>
      )}

      {/* Menu items */}
      <div className="px-2 py-2">
        {USER_DROPDOWN_ITEMS.map((item) => (
          <DropdownMenuItem key={item.href} item={item} onClose={onClose} />
        ))}
      </div>

      {/* Footer + logout */}
      <div className="border-t border-white/[0.05] px-2 py-2">
        {USER_DROPDOWN_FOOTER.map((item) => (
          <DropdownMenuItem key={item.href} item={item} onClose={onClose} />
        ))}
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-all hover:bg-red-500/8 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
            <LogOut className="h-3.5 w-3.5 text-red-400" />
          </div>
          <span className="font-medium">
            {isLoggingOut ? "Signing out…" : "Sign out"}
          </span>
        </button>
      </div>
    </div>
  );
}

// Search overlay

/**
 * A search overlay component that will render a search input and close button
 * when the `isOpen` prop is `true`.
 * The component will render a fixed position overlay with a dark background and
 * a centered search input with a close button.
 * Clicking outside the search input will trigger the `onClose` prop.
 * The search input will be focused when the component is rendered.
 *
 * @param {boolean} isOpen - Whether the search overlay should be open
 * @param {() => void} onClose - Callback for when the search overlay should be closed
 * @param {React.RefObject<HTMLInputElement | null>} searchRef - A ref to the search input
 */
function SearchOverlay({
  isOpen,
  onClose,
  searchRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-24">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl animate-in fade-in slide-in-from-top-4 duration-150">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1117]/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search challenges, events, teams…"
              className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-slate-600 outline-none"
            />
            <button
              onClick={onClose}
              className="rounded-lg border border-white/[0.07] p-1 text-slate-600 hover:text-slate-400 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="px-4 py-6 text-center">
            <p className="font-mono text-xs text-slate-700">
              Type to search across the platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile drawer

/**
 * Mobile menu component
 *
 * @param {boolean} isOpen - Whether the menu is open or not
 * @param {ReturnType<typeof useNavbar>["user"]} user - The user object from the navbar context
 * @param {(href: string) => boolean} isActive - A callback function to determine if a link is active or not
 * @param {number} liveCount - The number of live events
 * @param {() => void} onClose - A callback function to close the menu
 * @param {() => void} onLogout - A callback function to sign out the user
 * @param {boolean} isLoggingOut - Whether the user is logging out or not
 */
function MobileMenu({
  isOpen,
  user,
  isActive,
  liveCount,
  onClose,
  onLogout,
  isLoggingOut,
}: {
  isOpen: boolean;
  user: ReturnType<typeof useNavbar>["user"];
  isActive: (href: string) => boolean;
  liveCount: number;
  onClose: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}) {
  if (!isOpen) return null;

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] animate-in slide-in-from-left duration-200">
        <div className="flex h-full flex-col border-r border-white/[0.06] bg-[#0a0e15]/98 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <Terminal className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="font-mono text-sm font-bold tracking-tight text-white">
                CTF Platform
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/[0.06] p-2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* User info */}
          {user && (
            <div className="border-b border-white/[0.05] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/[0.08] ring-1 ring-white/[0.1]">
                  {user.avatar?.url ? (
                    <Image
                      src={user.avatar.url}
                      alt={user.username}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-mono text-sm font-bold text-slate-300">
                      {user.username.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-mono text-sm font-semibold text-white">
                      {user.username}
                    </p>
                    {isAdmin && (
                      <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] text-amber-400 ring-1 ring-amber-500/20 capitalize shrink-0">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {(user.score ?? 0).toLocaleString()} pts
                    </span>
                    <span className="text-slate-700">·</span>
                    <span className="font-mono text-xs text-slate-500">
                      {user.solvedChallenges?.length ?? 0} solved
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            <p className="px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700">
              Navigation
            </p>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive(item.href)
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200",
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4",
                    isActive(item.href) ? "text-emerald-400" : "text-slate-600",
                  )}
                />
                {item.label}
                {item.href === "/events" && liveCount > 0 && (
                  <span className="ml-auto flex items-center gap-0.5 rounded-full bg-red-500/15 px-1.5 py-0.5 font-mono text-[9px] text-red-400">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-red-400" />{" "}
                    {liveCount}
                  </span>
                )}
              </Link>
            ))}

            {/* Admin panel link — mobile */}
            {isAdmin && user && (
              <>
                <p className="px-3 pb-1 pt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700">
                  Admin
                </p>
                <Link
                  href="/admin"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive("/admin")
                      ? "bg-amber-500/10 text-amber-300"
                      : "text-slate-500 hover:bg-amber-500/[0.06] hover:text-amber-300",
                  )}
                >
                  {user.role === "superadmin" ? (
                    <Crown
                      className={cn(
                        "h-4 w-4",
                        isActive("/admin")
                          ? "text-amber-400"
                          : "text-slate-600",
                      )}
                    />
                  ) : (
                    <LayoutDashboard
                      className={cn(
                        "h-4 w-4",
                        isActive("/admin")
                          ? "text-amber-400"
                          : "text-slate-600",
                      )}
                    />
                  )}
                  Admin Dashboard
                  {isActive("/admin") && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                </Link>
              </>
            )}

            <p className="px-3 pb-1 pt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700">
              Account
            </p>
            {USER_DROPDOWN_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href!}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-all hover:bg-white/[0.04] hover:text-slate-200"
              >
                <item.icon className="h-4 w-4 text-slate-600" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="border-t border-white/[0.05] px-3 py-4">
            <button
              onClick={onLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/8 hover:text-red-300 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export

export function Navbar() {
  const {
    user,
    isMobileOpen,
    setMobileOpen,
    isUserMenuOpen,
    setUserMenuOpen,
    isScrolled,
    isSearchOpen,
    setSearchOpen,
    userMenuRef,
    searchRef,
    logout,
    isLoggingOut,
    liveCount,
    unreadCount,
    isActive,
  } = useNavbar();

  return (
    <>
      <header
        className={cn(
          "fixed left-0 right-0 top-0 z-40 transition-all duration-300",
          isScrolled
            ? "border-b border-white/[0.06] bg-[#080c10]/90 shadow-lg shadow-black/20 backdrop-blur-xl"
            : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="group flex shrink-0 items-center gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 transition-all group-hover:bg-emerald-500/15 group-hover:ring-emerald-500/30">
              <Terminal className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="hidden font-mono text-sm font-bold tracking-tight text-white sm:block">
              CTF<span className="text-emerald-400">.</span>io
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                liveCount={liveCount}
              />
            ))}
          </nav>

          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-2">
            <SearchTrigger onClick={() => setSearchOpen(true)} />

            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-slate-400 transition-all hover:border-white/[0.1] hover:bg-white/[0.06] hover:text-slate-200 xl:hidden"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            <NotifBell count={unreadCount} />

            <div className="hidden sm:flex">
              <ConnectionIndicator />
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <UserButton
                user={user!}
                isOpen={isUserMenuOpen}
                onClick={() => setUserMenuOpen((v) => !v)}
              />
              <UserDropdown
                user={user!}
                isOpen={isUserMenuOpen}
                menuRef={userMenuRef}
                onClose={() => setUserMenuOpen(false)}
                onLogout={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                isLoggingOut={isLoggingOut}
              />
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-slate-400 transition-all hover:border-white/[0.1] hover:text-slate-200 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setSearchOpen(false)}
        searchRef={searchRef}
      />

      <MobileMenu
        isOpen={isMobileOpen}
        user={user}
        isActive={isActive}
        liveCount={liveCount}
        onClose={() => setMobileOpen(false)}
        onLogout={() => {
          setMobileOpen(false);
          logout();
        }}
        isLoggingOut={isLoggingOut}
      />

      <div className="h-14" />
    </>
  );
}
