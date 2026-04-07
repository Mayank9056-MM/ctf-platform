"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useInboxSummary } from "@/modules/notification/hooks/useInboxSummary";
import { useLiveEvents } from "@/modules/events/hooks/useLiveEvents";
import { useLogout } from "@/modules/auth/hooks/useLogout";
import { useAuthStore } from "@/modules/auth/store/auth.store";

export function useNavbar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isScrolled, setScrolled] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  // Live event count — badge on Events nav item
  const { data: liveEventsData } = useLiveEvents();
  const liveCount = liveEventsData?.data?.events?.length ?? 0;

  // Notification unread count — bell badge
  const { data: summary } = useInboxSummary();
  const unreadCount = summary?.unreadCount ?? 0;

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close everything on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Close user menu on outside click
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isUserMenuOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [isSearchOpen]);

  // Keyboard shortcuts: Cmd/Ctrl+K → search, Esc → close all
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setMobileOpen(false);
        setUserMenuOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const isActive = useCallback(
    (href: string) =>
      href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(href),
    [pathname],
  );

  return {
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
  };
}
