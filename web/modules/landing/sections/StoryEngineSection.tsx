import { useInView, motion } from "motion/react";
import Link from "next/link";
import { useRef } from "react";

export function StoryEngineSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const nodes = [
    { id: "entry", label: "Briefing", x: "10%", y: "15%", type: "briefing" },
    { id: "choice1", label: "Choice", x: "38%", y: "10%", type: "choice" },
    { id: "chall1", label: "Challenge", x: "62%", y: "5%", type: "challenge" },
    { id: "chall2", label: "Challenge", x: "62%", y: "38%", type: "challenge" },
    { id: "cut1", label: "Cutscene", x: "38%", y: "50%", type: "cutscene" },
    { id: "end", label: "End", x: "85%", y: "22%", type: "end" },
  ];

  const typeColors: Record<string, string> = {
    briefing: "#38bdf8",
    choice: "#fbbf24",
    challenge: "#f87171",
    cutscene: "#a78bfa",
    end: "#34d399",
  };

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/[0.03] to-transparent" />

      <div className="mx-auto max-w-screen-xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400">
                Story Engine
              </span>
            </div>

            <h2 className="mb-4 font-mono text-3xl font-black text-white leading-tight tracking-tight">
              Non-linear missions.
              <br />
              <span className="text-violet-400">Every choice matters.</span>
            </h2>

            <p className="mb-6 font-mono text-sm leading-relaxed text-slate-400">
              Built on a directed graph engine — challenges, cutscenes,
              briefings and branching choices form interconnected narrative
              arcs. Solve a challenge to unlock a new path. Make the wrong
              choice and a branch closes permanently.
            </p>

            <div className="space-y-3">
              {[
                ["Challenge nodes", "Solve a CTF flag to advance the story"],
                [
                  "Choice nodes",
                  "Branch the narrative — paths diverge permanently",
                ],
                [
                  "Cutscene nodes",
                  "Lore-rich auto-advancing narrative sequences",
                ],
                ["Briefing nodes", "Intel drops that set up the next mission"],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 text-violet-400 font-mono text-xs">
                    ▸
                  </span>
                  <div>
                    <span className="font-mono text-xs font-bold text-white">
                      {title}:{" "}
                    </span>
                    <span className="font-mono text-xs text-slate-500">
                      {desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/stories"
              className="mt-8 inline-flex items-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-violet-400 hover:bg-violet-500/20 transition-all"
            >
              Browse Story Arcs →
            </Link>
          </motion.div>

          {/* Right: graph visualisation */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm overflow-hidden"
            style={{ height: 280 }}
          >
            {/* SVG edges */}
            <svg
              className="absolute inset-0 w-full h-full"
              style={{ zIndex: 0 }}
            >
              {[
                ["10%,15%", "38%,10%"],
                ["10%,15%", "38%,50%"],
                ["38%,10%", "62%,5%"],
                ["38%,10%", "62%,38%"],
                ["62%,5%", "85%,22%"],
                ["62%,38%", "85%,22%"],
                ["38%,50%", "62%,38%"],
              ].map(([from, to], i) => {
                const [fx, fy] = from
                  .split(",")
                  .map((v) => parseFloat(v) / 100);
                const [tx, ty] = to.split(",").map((v) => parseFloat(v) / 100);
                return (
                  <motion.line
                    key={i}
                    x1={`${fx * 100}%`}
                    y1={`${fy * 100}%`}
                    x2={`${tx * 100}%`}
                    y2={`${ty * 100}%`}
                    stroke="rgba(148,163,184,0.15)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                    transition={{ duration: 0.6, delay: 0.4 + i * 0.08 }}
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node, i) => (
              <motion.div
                key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: node.x, top: node.y }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{
                  duration: 0.35,
                  delay: 0.5 + i * 0.1,
                  type: "spring",
                  damping: 14,
                }}
              >
                <div
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 backdrop-blur-sm cursor-default"
                  style={{
                    borderColor: `${typeColors[node.type]}40`,
                    background: `${typeColors[node.type]}12`,
                  }}
                >
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: typeColors[node.type] }}
                  />
                  <span
                    className="font-mono text-[10px] font-bold whitespace-nowrap"
                    style={{ color: typeColors[node.type] }}
                  >
                    {node.label}
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Label */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">
                Story Arc: Operation Shadow Grid
              </span>
              <span className="font-mono text-[9px] text-violet-400/60">
                {nodes.length} nodes · 3 branches
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
