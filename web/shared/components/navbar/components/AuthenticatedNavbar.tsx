import { cn } from "@/lib/utils";
import { useNavbar } from "../hooks/useNavbar";
import { NAV_ITEMS } from "../lib/navbar.config";
import { MobileMenu } from "./MobileMenu";
import { SearchOverlay } from "./SearchOverlay";
import { Menu, Search } from "lucide-react";
import { UserDropdown } from "./UserDropdown";
import { UserButton } from "./UserButton";
import { ConnectionIndicator } from "../../ConnectionIndicator";
import { NotifBell } from "./NotifBell";
import { SearchTrigger } from "./SearchTrigger";
import { NavLink } from "./NavLink";
import { Logo } from "./Logo";

export function AuthenticatedNavbar({ isScrolled }: { isScrolled: boolean }) {
  const {
    user,
    isMobileOpen,
    setMobileOpen,
    isUserMenuOpen,
    setUserMenuOpen,
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
          <Logo variant="app" />

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

            {/* Mobile search icon */}
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

            {/* User dropdown */}
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

            {/* Mobile hamburger */}
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
    </>
  );
}
