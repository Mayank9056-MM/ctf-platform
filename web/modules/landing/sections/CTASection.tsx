import { useInView, motion } from "motion/react";
import Link from "next/link";
import { useRef } from "react";

export function CtaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      {/* Bg effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.03] to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[800px] rounded-full bg-emerald-500/5 blur-[80px]" />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-400">
              Event Active · Operation Shadow Grid
            </span>
          </div>

          <h2 className="mb-5 font-mono text-4xl font-black text-white leading-tight tracking-tight">
            Are you ready
            <br />
            <span className="text-emerald-400">to start the hunt?</span>
          </h2>

          <p className="mb-8 font-mono text-sm leading-relaxed text-slate-400 max-w-lg mx-auto">
            340+ challenges. Live CTF events. Branching story missions. A
            leaderboard that updates in real-time. Everything you need to
            sharpen your skills and compete at the top.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-emerald-500/50 bg-emerald-500/15 px-7 py-3.5 font-mono text-sm font-black uppercase tracking-widest text-emerald-400 shadow-2xl shadow-emerald-500/20 transition-all hover:bg-emerald-500/25 hover:border-emerald-400/70 hover:shadow-emerald-500/30"
            >
              <span className="relative z-10">Create Free Account</span>
              <span className="relative z-10 font-mono text-emerald-400/60">
                →
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>

          <p className="mt-6 font-mono text-[10px] text-slate-600">
            No credit card required · Free tier includes 80+ challenges
          </p>
        </motion.div>
      </div>
    </section>
  );
}
