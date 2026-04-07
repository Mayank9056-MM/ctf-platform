// shared/components/navbar/types/navbar.types.ts

export type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  role?: "user" | "admin" | "superadmin";
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