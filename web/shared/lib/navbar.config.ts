// shared/components/navbar/lib/navbar.config.ts
import {
  Bell,
  BookOpen,
  Flag,
  HelpCircle,
  Key,
  LayoutDashboard,
  Radio,
  Settings,
  Trophy,
  User,
  Users,
} from "lucide-react";
import type { DropdownItem, NavItem } from "../types/navbar.types";

// Primary nav

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Challenges", href: "/challenges", icon: Flag },
  { label: "Events", href: "/events", icon: Radio },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Stories", href: "/stories", icon: BookOpen },
  { label: "Teams", href: "/teams", icon: Users },
];

// User dropdown

export const USER_DROPDOWN_ITEMS: DropdownItem[] = [
  {
    label: "Profile",
    href: "/profile",
    icon: User,
    description: "Your stats and solved challenges",
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    description: "Inbox and alerts",
  },
  {
    label: "Sessions",
    href: "/settings/sessions",
    icon: Key,
    description: "Manage active devices",
  },
  {
    label: "Settings",
    href: "/settings/account",
    icon: Settings,
    description: "Account and preferences",
  },
];

export const USER_DROPDOWN_FOOTER: DropdownItem[] = [
  { label: "Help & Support", href: "/support", icon: HelpCircle },
];
