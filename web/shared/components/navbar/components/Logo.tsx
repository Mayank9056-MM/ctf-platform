import { Terminal } from "lucide-react";
import Link from "next/link";

/**
 * Shared logo — renders the correct href and wordmark per variant.
 */
export function Logo({
  variant = "app",
  onClick,
}: {
  variant?: "public" | "app";
  onClick?: () => void;
}) {
  return (
    <Link
      href={variant === "public" ? "/" : "/dashboard"}
      onClick={onClick}
      className="group flex shrink-0 items-center gap-2.5"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 transition-all group-hover:bg-emerald-500/15 group-hover:ring-emerald-500/30">
        <Terminal className="h-4 w-4 text-emerald-400" />
      </div>
      <span className="hidden font-mono text-sm font-bold tracking-tight text-white sm:block">
        CTF
        <span className="text-emerald-400">
          {variant === "public" ? "Platform" : ".io"}
        </span>
      </span>
    </Link>
  );
}