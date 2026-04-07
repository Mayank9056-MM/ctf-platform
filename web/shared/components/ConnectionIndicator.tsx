"use client";

import { cn } from "@/lib/utils";
import { useSocket } from "@/services/providers/SocketProvider";


export function ConnectionIndicator() {
  const { isConnected } = useSocket();

  return (
    <div className="flex items-center gap-1.5" title={isConnected ? "Live" : "Reconnecting…"}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full transition-colors duration-300",
          isConnected
            ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
            : "animate-pulse bg-amber-400"
        )}
      />
      <span className="font-mono text-[9px] text-slate-600 hidden sm:block">
        {isConnected ? "Live" : "Reconnecting"}
      </span>
    </div>
  );
}