"use client";

import Link from "next/link";
import { FeatureCard } from "./components/FeatureCard";
import { TerminalBoot } from "./components/TerminalBoot";
import { FEATURES, STATS } from "./data/landing.data";
import { CtaSection } from "./sections/CTASection";
import { Footer } from "./sections/Footer";
import { StoryEngineSection } from "./sections/StoryEngineSection";
import { Scanlines } from "./effects/Scanlines";
import { GridOverlay } from "./effects/GridOverlay";
import { GlowOrbs } from "./effects/GlowOrbs";
import { Navbar } from "@/shared/components/navbar/Navbar";
import { motion } from "motion/react";
import { StatCard } from "./components/StatCard";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#050810] text-white overflow-x-hidden">
      {/* Persistent background layers */}
      <Scanlines />
      <GridOverlay />
      <GlowOrbs />

      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-20 pb-16">
        <div className="mx-auto max-w-screen-xl px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Hero copy */}
            <div>
              {/* Status badge */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-4 py-2"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
                  Event Live · Operation Shadow Grid
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-5 font-mono text-5xl font-black leading-[1.08] tracking-tight lg:text-6xl"
              >
                <span className="text-white">Capture.</span>
                <br />
                <span className="text-emerald-400">Exploit.</span>
                <br />
                <span className="text-white">Dominate.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="mb-8 font-mono text-sm leading-relaxed text-slate-400 max-w-md"
              >
                A full-stack CTF platform with 340+ challenges, live event
                infrastructure, a graph-based story engine, real-time
                leaderboards, and team support. Built for serious competitors.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="flex flex-col sm:flex-row gap-3 mb-10"
              >
                <Link
                  href="/register"
                  className="group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-xl border border-emerald-500/50 bg-emerald-500/15 px-6 py-3.5 font-mono text-sm font-black uppercase tracking-widest text-emerald-400 shadow-xl shadow-emerald-500/15 transition-all hover:bg-emerald-500/22 hover:shadow-emerald-500/25"
                >
                  Start Hacking Free
                </Link>
                <Link
                  href="/events"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/40 px-6 py-3.5 font-mono text-sm font-bold uppercase tracking-widest text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800/50 hover:text-white"
                >
                  View Active Events
                </Link>
              </motion.div>

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex items-center gap-6"
              >
                <div className="flex -space-x-2">
                  {["1F", "2A", "3B", "4C", "5D"].map((id) => (
                    <div
                      key={id}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#050810] bg-slate-700 font-mono text-[9px] text-slate-400"
                    >
                      {id[0]}
                    </div>
                  ))}
                </div>
                <span className="font-mono text-[11px] text-slate-500">
                  <span className="text-white font-bold">12,400+</span> hackers
                  competing
                </span>
              </motion.div>
            </div>

            {/* Right: Terminal */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex justify-center lg:justify-end"
            >
              <TerminalBoot />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-700">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="h-4 w-px bg-gradient-to-b from-slate-700 to-transparent"
          />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative py-16 border-y border-slate-800/50">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-900/30 to-transparent" />
        <div className="relative mx-auto max-w-screen-xl px-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STATS.map((stat, i) => (
              <StatCard key={stat.label} {...stat} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24">
        <div className="mx-auto max-w-screen-xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-400/70">
              {"// Platform Features"}
            </p>
            <h2 className="font-mono text-3xl font-black text-white tracking-tight">
              Everything a serious CTF platform needs.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Story Engine */}
      <StoryEngineSection />

      {/* CTA */}
      <CtaSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
