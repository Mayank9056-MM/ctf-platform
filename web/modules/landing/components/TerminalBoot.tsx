import { cn } from "@/lib/utils";
import { TERMINAL_LINES } from "../data/landing.data";
import { useEffect, useState } from "react";
import { motion } from "motion/react";

export function TerminalBoot() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    TERMINAL_LINES.forEach((line, i) => {
      setTimeout(() => setVisibleLines(i + 1), line.delay + 400);
    });
    const blink = setInterval(() => setCursor((c) => !c), 530);
    return () => clearInterval(blink);
  }, []);

  return (
    <div className="w-full max-w-lg rounded-xl border border-slate-700/60 bg-[#0a0d14]/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/60">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-slate-700/40 bg-slate-800/40 px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
          ctf-platform — zsh
        </span>
      </div>
      {/* Terminal body */}
      <div className="p-5 space-y-1.5 min-h-[220px]">
        {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-start gap-2"
          >
            <span
              className={cn(
                "font-mono text-xs leading-relaxed",
                line.type === "cmd" && "text-emerald-400",
                line.type === "ok" && "text-slate-400",
                line.type === "warn" && "text-amber-400",
              )}
            >
              {line.text}
            </span>
          </motion.div>
        ))}
        {visibleLines < TERMINAL_LINES.length && (
          <span
            className={cn(
              "inline-block w-2 h-3.5 bg-emerald-400 align-middle",
              cursor ? "opacity-100" : "opacity-0",
            )}
          />
        )}
      </div>
    </div>
  );
}
