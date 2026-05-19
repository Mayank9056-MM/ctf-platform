// shared/components/navbar/types/navbar.types.ts

import { useNavbar } from "../hooks/useNavbar";

export type AuthUser = NonNullable<ReturnType<typeof useNavbar>["user"]>;


export type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  role?: "user" | "admin" | "superadmin";
  badge?: string | number;
  hasIndicator?: boolean;
};

export type PublicNavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  hasIndicator?: boolean;
};


export type NavSection = {
  title?: string;
  items: NavItem[];
};

export type DropdownItem = {
  label: string;
  href?: string;
  icon: React.ElementType;
  onClick?: () => void;
  variant?: "default" | "danger";
  description?: string;
};