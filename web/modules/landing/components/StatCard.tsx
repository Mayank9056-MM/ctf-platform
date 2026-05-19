import { useRef } from "react";
import { STATS } from "../data/landing.data";
import { useInView, motion } from "motion/react";

export function StatCard({
  value,
  label,
  suffix,
  index,
}: (typeof STATS)[0] & { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="relative rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm overflow-hidden group hover:border-emerald-500/20 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <p className="font-mono text-3xl font-black text-white tracking-tight">
        {value}
        {suffix && (
          <span className="text-emerald-400/80 text-xl">{suffix}</span>
        )}
      </p>
      <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}
