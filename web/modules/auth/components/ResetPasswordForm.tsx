"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import {
  Terminal,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  Lock,
  ShieldCheck,
  Check,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useResetPassword } from "@/modules/auth/hooks/useResetPassword";
import { ResetPasswordFormData, resetPasswordSchema } from "@/modules/auth/schema/auth.schema";

// Field Error

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

// Password Strength

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    { label: "8+ chars", pass: password.length >= 8 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
    { label: "Special", pass: /[^a-zA-Z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.pass).length;
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
  const labels = ["Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i < score ? colors[score - 1] : "#1e2435" }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {checks.map((c) => (
            <span
              key={c.label}
              className={cn(
                "flex items-center gap-1 text-[11px] transition-colors",
                c.pass ? "text-emerald-400" : "text-slate-500",
              )}
            >
              <Check className={cn("h-2.5 w-2.5 transition-opacity", c.pass ? "opacity-100" : "opacity-0")} />
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className="text-[11px] font-mono font-medium shrink-0" style={{ color: colors[score - 1] }}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

// Success State

function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6 text-center"
    >
      <div className="flex justify-center">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
            <ShieldCheck className="h-7 w-7 text-emerald-400" />
          </div>
          <span className="absolute inset-0 rounded-2xl animate-ping bg-emerald-500/10" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">Password reset!</h2>
        <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
          Your password has been updated. All existing sessions have been invalidated for security.
        </p>
      </div>
      <Link
        href="/login"
        className={cn(
          "flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2.5 text-sm font-semibold",
          "bg-emerald-500 text-slate-950 transition-all duration-200",
          "hover:bg-emerald-400 hover:shadow-[0_0_24px_rgba(52,211,153,0.25)]",
        )}
      >
        <ShieldCheck className="h-4 w-4" />
        Sign in with new password
      </Link>
    </motion.div>
  );
}

// Invalid Token State

function InvalidTokenState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6 text-center"
    >
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/30">
          <AlertTriangle className="h-7 w-7 text-red-400" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">Link expired</h2>
        <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
          This reset link is invalid or has expired. Reset links are single-use and expire after 15 minutes.
        </p>
      </div>
      <Link
        href="/forgot-password"
        className={cn(
          "flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2.5 text-sm font-semibold",
          "bg-emerald-500 text-slate-950 transition-all duration-200",
          "hover:bg-emerald-400 hover:shadow-[0_0_24px_rgba(52,211,153,0.25)]",
        )}
      >
        Request a new link
      </Link>
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-emerald-400 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to sign in
      </Link>
    </motion.div>
  );
}

// Inner Component

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);

  // If there's no token in the URL at all, show invalid state immediately
  useEffect(() => {
    if (!token) setTokenInvalid(true);
  }, [token]);

  const { mutate: resetPassword, isPending } = useResetPassword();

  const {
    register: field,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const password = watch("newPassword");

  const onSubmit = (data: ResetPasswordFormData) => {
    if (!token) return;

    resetPassword(
      {
        token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      },
      {
        onSuccess: () => setResetSuccess(true),
        onError: (err) => {
          if (err?.statusCode === 400 || err?.statusCode === 404) {
            setTokenInvalid(true);
          }
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-[#050810] flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between p-12 overflow-hidden border-r border-slate-800/60">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute bottom-1/3 left-0 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl" />

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

        {/* Hero */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <span className="font-mono text-xs tracking-[0.3em] text-emerald-400/80 uppercase">
              {"// Reset password"}
            </span>
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight text-white leading-[1.1]">
              New password,
              <br />
              <span className="text-emerald-400">fresh start.</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Choose a strong password you haven&apos;t used before. All active sessions
              will be signed out after the reset.
            </p>
          </div>

          {/* Requirements */}
          <div className="space-y-3">
            <p className="font-mono text-xs tracking-widest text-slate-600 uppercase">
              Password requirements
            </p>
            <div className="space-y-2">
              {[
                "At least 8 characters long",
                "One uppercase letter",
                "One number",
                "One special character",
              ].map((rule) => (
                <div key={rule} className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/50 shrink-0" />
                  <p className="text-sm text-slate-400">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Terminal snippet */}
        <div className="relative z-10">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 mb-3">
              {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
                <div key={c} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <pre className="font-mono text-xs text-slate-400 leading-relaxed">
              <span className="text-emerald-400">$</span> hash --algo bcrypt{"\n"}
              <span className="text-emerald-400">✓</span> Salt rounds: 12{"\n"}
              <span className="text-emerald-400">$</span> token --invalidate-all{"\n"}
              <span className="text-yellow-400">⚡</span> Sessions cleared
            </pre>
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
            {tokenInvalid ? (
              <InvalidTokenState key="invalid" />
            ) : resetSuccess ? (
              <SuccessState key="success" />
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-7"
              >
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Set new password
                  </h2>
                  <p className="text-sm text-slate-500">
                    This link expires in 15 minutes and can only be used once.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  {/* New password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-400 tracking-widest uppercase">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input
                        {...field("newPassword")}
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                        autoFocus
                        className={cn(
                          "w-full rounded-lg border bg-slate-900/60 py-2.5 pl-9 pr-10 text-sm text-white",
                          "placeholder:text-slate-600 transition-all duration-200 outline-none",
                          "focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50",
                          errors.newPassword
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
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrengthBar password={password ?? ""} />
                    <FieldError message={errors.newPassword?.message} />
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-400 tracking-widest uppercase">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input
                        {...field("confirmPassword")}
                        type={showConfirm ? "text" : "password"}
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        className={cn(
                          "w-full rounded-lg border bg-slate-900/60 py-2.5 pl-9 pr-10 text-sm text-white",
                          "placeholder:text-slate-600 transition-all duration-200 outline-none",
                          "focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50",
                          errors.confirmPassword
                            ? "border-red-500/60 focus:ring-red-500/20"
                            : "border-slate-700 hover:border-slate-600",
                        )}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FieldError message={errors.confirmPassword?.message} />
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
                        Resetting...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Reset password
                      </span>
                    )}
                  </button>
                </form>

                <div className="flex items-center justify-center">
                  <Link
                    href="/login"
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to sign in
                  </Link>
                </div>

                <p className="text-center text-xs text-slate-700">
                  All active sessions will be signed out after reset.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050810] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full bg-emerald-500/50 animate-bounce"
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
            <p className="font-mono text-xs text-slate-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}