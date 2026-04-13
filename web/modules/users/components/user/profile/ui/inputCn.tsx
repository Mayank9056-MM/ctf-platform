import { cn } from "@/lib/utils";

export function inputCn(hasError: boolean, extra?: string) {
  return cn(
    "w-full rounded-xl border bg-white/[0.04] px-4 py-3 font-mono text-sm text-white placeholder:text-slate-700 outline-none transition-all",
    hasError
      ? "border-red-500/40 focus:ring-1 focus:ring-red-500/20"
      : "border-white/[0.07] focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20",
    extra,
  );
}
