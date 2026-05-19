import { useRef } from "react";
import { FEATURES } from "../data/landing.data";
import { useInView, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { colorMap } from "../constants/landing.constants";

export function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 3) * 0.12, ease: "easeOut" }}
      className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/30 p-6 backdrop-blur-sm hover:border-slate-700/80 transition-all duration-300 hover:bg-slate-900/50 cursor-default"
    >
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          `bg-gradient-to-br from-${feature.color}-500/5 via-transparent to-transparent`,
        )}
      />

      {/* Icon */}
      <div className="mb-4 flex items-center justify-between">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border text-lg font-black",
            colorMap[feature.color],
          )}
        >
          {feature.icon}
        </span>
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest",
            colorMap[feature.color],
          )}
        >
          {feature.tag}
        </span>
      </div>

      <h3 className="mb-2 font-mono text-sm font-black text-white tracking-tight">
        {feature.title}
      </h3>
      <p className="font-mono text-xs leading-relaxed text-slate-500">
        {feature.desc}
      </p>
    </motion.div>
  );
}
