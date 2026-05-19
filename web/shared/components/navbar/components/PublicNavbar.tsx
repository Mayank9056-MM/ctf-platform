import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { PUBLIC_NAV_ITEMS } from "../lib/navbar.config";
import Link from "next/link";

export function PublicNavbar({ isScrolled }: { isScrolled: boolean }) {
  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-40 transition-all duration-300",
        isScrolled
          ? "border-b border-emerald-500/10 bg-[#050810]/90 shadow-lg shadow-black/40 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo variant="public" />

        {/* Public nav links */}
        <nav className="hidden items-center gap-6 md:flex">
          {PUBLIC_NAV_ITEMS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-emerald-400"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden font-mono text-xs uppercase tracking-widest text-slate-400 transition-colors hover:text-white sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-emerald-400 shadow-lg shadow-emerald-500/10 transition-all hover:border-emerald-400/60 hover:bg-emerald-500/20 hover:shadow-emerald-500/25"
          >
            Start Hacking
          </Link>
        </div>
      </div>
    </header>
  );
}