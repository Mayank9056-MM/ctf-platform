"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { AnimatePresence, motion } from "motion/react";
import {
  Eye,
  EyeOff,
  Terminal,
  Mail,
  Lock,
  // Github,
  LogIn,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useGitHubAuth } from "../hooks/useGithubAuth";
import { useLogin } from "../hooks/useLogin";
import { useGoogleAuth } from "../hooks/useGoggleAuth";
import { LoginFormData, loginSchema } from "../schema/auth.schema";
import { cn } from "@/lib/utils";

// Helpers

function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="flex items-center gap-1 text-xs text-red-400 mt-1"
        >
          <AlertCircle className="h-3 w-3 shrink-0" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

// Simulated "recent solvers" ticker — replace with real data from your API
const RECENT_EVENTS = [
  { user: "sp1d3r_", challenge: "SQL Injection #3", pts: 350, diff: "1m ago" },
  { user: "0xdeadbeef", challenge: "RSA Warmup", pts: 200, diff: "3m ago" },
  { user: "null_ptr", challenge: "PNG Exif", pts: 150, diff: "5m ago" },
  { user: "h4x0r404", challenge: "Buffer Overflow", pts: 500, diff: "8m ago" },
];

// Main Component

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";

  const { mutate: login, isPending: isLoginPending } = useLogin();
  const { mutate: googleAuth, isPending: isGooglePending } = useGoogleAuth();
  const { initiateGitHubLogin } = useGitHubAuth();

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const isLoading = isLoginPending || isGooglePending;

  // Ticker animation
  useEffect(() => {
    const t = setInterval(
      () => setTickerIndex((i) => (i + 1) % RECENT_EVENTS.length),
      3000,
    );
    return () => clearInterval(t);
  }, []);

  const onSubmit = (data: LoginFormData) =>
    login({
      ...data,
      from: searchParams.get("from"),
    });

  const handleGoogleSuccess = (cred: CredentialResponse) => {
    if (cred.credential) googleAuth(cred.credential);
  };

  return (
    <div className="min-h-screen bg-[#050810] flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between p-12 overflow-hidden border-r border-slate-800/60">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Glows */}
        <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <Terminal className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <span className="font-mono text-lg font-semibold tracking-tight text-white">
              CTF<span className="text-emerald-400">Platform</span>
            </span>
          </Link>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <span className="font-mono text-xs tracking-[0.3em] text-emerald-400/80 uppercase">
              {"// Welcome back"}
            </span>
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight text-white leading-[1.1]">
              Ready to
              <br />
              <span className="text-emerald-400">hunt flags?</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Your score, team, and unsolved challenges are waiting. Jump back
              in.
            </p>
          </div>

          {/* Live activity feed */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs text-slate-500 uppercase tracking-widest">
                Live activity
              </span>
            </div>

            <div className="h-12 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tickerIndex}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -12, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3"
                >
                  <div className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                    <span className="font-mono text-[10px] text-emerald-400">
                      {RECENT_EVENTS[tickerIndex].user
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">
                      <span className="text-emerald-400 font-mono">
                        {RECENT_EVENTS[tickerIndex].user}
                      </span>{" "}
                      solved{" "}
                      <span className="text-white">
                        {RECENT_EVENTS[tickerIndex].challenge}
                      </span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-xs font-bold text-emerald-400">
                      +{RECENT_EVENTS[tickerIndex].pts}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      {RECENT_EVENTS[tickerIndex].diff}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Challenge categories */}
        <div className="relative z-10 flex flex-wrap gap-2">
          {[
            "web",
            "crypto",
            "pwn",
            "forensics",
            "reversing",
            "osint",
            "misc",
          ].map((cat) => (
            <span
              key={cat}
              className="rounded-md border border-slate-800 bg-slate-900/40 px-2.5 py-1 font-mono text-[11px] text-slate-500"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-sm space-y-7">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <Terminal className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="font-mono text-base font-semibold text-white">
              CTF<span className="text-emerald-400">Platform</span>
            </span>
          </div>

          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Sign in
            </h2>
            <p className="text-sm text-slate-500">
              No account?{" "}
              <Link
                href="/register"
                className="text-emerald-400 hover:text-emerald-300 transition-colors underline underline-offset-2"
              >
                Create one free
              </Link>
            </p>
          </div>

          {/* Post-registration banner */}
          <AnimatePresence>
            {justRegistered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-300">
                      Account created!
                    </p>
                    <p className="text-xs text-emerald-400/70 mt-0.5">
                      Check your inbox and verify your email, then sign in.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className={cn(
                "relative overflow-hidden rounded-lg border border-slate-700 bg-slate-900/60 transition-all",
                "hover:border-slate-600 hover:bg-slate-800/60",
                isLoading && "pointer-events-none opacity-50",
              )}
              style={{ height: "42px" }}
            >
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {}}
                useOneTap={false}
                type="icon"
                shape="rectangular"
                size="large"
                width={9999}
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-200">
                  Google
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={initiateGitHubLogin}
              disabled={isLoading}
              className={cn(
                "flex h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-700",
                "bg-slate-900/60 px-4 text-sm font-medium text-slate-200 transition-all",
                "hover:border-slate-600 hover:bg-slate-800/60 hover:text-white",
                "disabled:pointer-events-none disabled:opacity-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
              )}
            >
              {/* <Github className="h-4 w-4" /> */}
              GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-slate-800" />
            <span className="mx-4 text-xs font-mono text-slate-600 shrink-0">
              or sign in with email
            </span>
            <div className="flex-1 border-t border-slate-800" />
          </div>

          {/* Login form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-400 tracking-widest uppercase">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  {...field("email")}
                  type="email"
                  placeholder="hacker@ctf.io"
                  autoComplete="email"
                  className={cn(
                    "w-full rounded-lg border bg-slate-900/60 py-2.5 pl-9 pr-4 text-sm text-white",
                    "placeholder:text-slate-600 transition-all duration-200 outline-none",
                    "focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50",
                    errors.email
                      ? "border-red-500/60 focus:ring-red-500/20"
                      : "border-slate-700 hover:border-slate-600",
                  )}
                />
              </div>
              <FieldError message={errors.email?.message} />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono text-slate-400 tracking-widest uppercase">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-slate-500 hover:text-emerald-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  {...field("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className={cn(
                    "w-full rounded-lg border bg-slate-900/60 py-2.5 pl-9 pr-10 text-sm text-white",
                    "placeholder:text-slate-600 transition-all duration-200 outline-none",
                    "focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50",
                    errors.password
                      ? "border-red-500/60 focus:ring-red-500/20"
                      : "border-slate-700 hover:border-slate-600",
                  )}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <FieldError message={errors.password?.message} />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "group relative w-full overflow-hidden rounded-lg px-4 py-2.5 text-sm font-semibold",
                "bg-emerald-500 text-slate-950 transition-all duration-200",
                "hover:bg-emerald-400 hover:shadow-[0_0_24px_rgba(52,211,153,0.25)]",
                "disabled:pointer-events-none disabled:opacity-60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60",
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  Sign in
                  <ChevronRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-700">
            Protected by rate limiting and brute-force detection.
          </p>
        </div>
      </div>
    </div>
  );
}
