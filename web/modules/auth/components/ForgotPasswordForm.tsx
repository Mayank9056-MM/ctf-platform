"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import {
  Terminal,
  Mail,
  AlertCircle,
  ArrowLeft,
  ShieldAlert,
  KeyRound,
  Wifi,
  Lock,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useForgotPassword } from "@/modules/auth/hooks/useForgotPassword";
import {
  ForgotPasswordFormData,
  forgotPasswordSchema,
} from "@/modules/auth/schema/auth.schema";

// Sub-components

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

// How it works steps

const STEPS = [
  {
    icon: Mail,
    title: "Enter your email",
    desc: "Provide the address tied to your account.",
  },
  {
    icon: ShieldAlert,
    title: "Check your inbox",
    desc: "A secure one-time link will arrive within 2 minutes.",
  },
  {
    icon: KeyRound,
    title: "Reset & get back",
    desc: "Click the link, set a new password, and you're in.",
  },
];

// Sent State

function EmailSentState({
  email,
  onRetry,
}: {
  email: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6 text-center"
    >
      {/* Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
            <Mail className="h-7 w-7 text-emerald-400" />
          </div>
          {/* Ping rings */}
          <span className="absolute inset-0 rounded-2xl animate-ping bg-emerald-500/10" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Check your inbox
        </h2>
        <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
          If{" "}
          <span className="font-mono text-emerald-400 break-all">{email}</span>{" "}
          is registered, reset instructions are on their way.
        </p>
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-left space-y-2">
        {[
          "Check your spam / junk folder",
          "Link expires in 15 minutes",
          "Only your latest link will work",
        ].map((tip) => (
          <div key={tip} className="flex items-start gap-2">
            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500/60 shrink-0" />
            <p className="text-xs text-slate-500">{tip}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={onRetry}
          className="w-full rounded-lg border border-slate-700 bg-slate-900/60 py-2.5 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-all"
        >
          Try a different email
        </button>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    </motion.div>
  );
}

// Main Component

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const {
    register: field,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword(data.email, {
      onSettled: () => {
        // Always transition to sent state — avoids email enumeration
        setSubmittedEmail(data.email);
        setSubmitted(true);
      },
    });
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
        <div className="absolute top-1/4 right-0 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/5 blur-3xl" />

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
              {"// Account recovery"}
            </span>
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight text-white leading-[1.1]">
              Lost access?
              <br />
              <span className="text-emerald-400">We&apos;ve got you.</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              A secure, time-limited reset link will be sent to your registered
              address. No account enumeration — we keep it vague for your
              safety.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <p className="font-mono text-xs tracking-widest text-slate-600 uppercase">
              How it works
            </p>
            <div className="space-y-3">
              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="flex items-start gap-4 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                    <step.icon className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-600">
                        0{i + 1}
                      </span>
                      <p className="text-sm font-medium text-slate-200">
                        {step.title}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="relative z-10">
          <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-900/30 px-4 py-3.5">
            <Lock className="h-4 w-4 shrink-0 text-slate-600 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              Reset tokens are single-use, hashed with SHA-256, and expire after
              15 minutes. Your session is protected by rate limiting and
              brute-force detection.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <Terminal className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="font-mono text-base font-semibold text-white">
              CTF<span className="text-emerald-400">Platform</span>
            </span>
          </div>

          <AnimatePresence mode="wait">
            {submitted ? (
              <EmailSentState
                key="sent"
                email={submittedEmail}
                onRetry={() => {
                  setSubmitted(false);
                  setSubmittedEmail("");
                }}
              />
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-7"
              >
                {/* Header */}
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Forgot password?
                  </h2>
                  <p className="text-sm text-slate-500">
                    Enter your email and we&apos;ll send a reset link.
                  </p>
                </div>

                {/* Form */}
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5"
                  noValidate
                >
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-400 tracking-widest uppercase">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input
                        {...field("email")}
                        type="email"
                        placeholder="hacker@ctf.io"
                        autoComplete="email"
                        autoFocus
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

                  <button
                    type="submit"
                    disabled={isPending}
                    className={cn(
                      "group relative w-full overflow-hidden rounded-lg px-4 py-2.5 text-sm font-semibold",
                      "bg-emerald-500 text-slate-950 transition-all duration-200",
                      "hover:bg-emerald-400 hover:shadow-[0_0_24px_rgba(52,211,153,0.25)]",
                      "disabled:pointer-events-none disabled:opacity-60",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60",
                    )}
                  >
                    {isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                        Sending link...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Mail className="h-4 w-4" />
                        Send reset link
                      </span>
                    )}
                  </button>
                </form>

                {/* Back to login */}
                <div className="flex items-center justify-center">
                  <Link
                    href="/login"
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to sign in
                  </Link>
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-slate-700">
                  Protected by rate limiting · Tokens expire in 15 minutes
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
