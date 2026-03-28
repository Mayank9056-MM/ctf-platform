"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye,
  EyeOff,
  Upload,
  X,
  // GitHub,
  ShieldCheck,
  Terminal,
  User,
  Mail,
  Lock,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRegister } from "../hooks/useRegister";
import { useGoogleAuth } from "../hooks/useGoggleAuth";
import { useGitHubAuth } from "../hooks/useGithubAuth";
import { RegisterFormData, registerSchema } from "../validation/auth.validator";

// ─── Sub-components ───────────────────────────────────────────────────────────

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
    { label: "Special char", pass: /[^a-zA-Z0-9]/.test(password) },
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
            style={{
              backgroundColor: i < score ? colors[score - 1] : "#1e2435",
            }}
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
              <Check
                className={cn(
                  "h-2.5 w-2.5 transition-opacity",
                  c.pass ? "opacity-100" : "opacity-0",
                )}
              />
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span
            className="text-[11px] font-mono font-medium"
            style={{ color: colors[score - 1] }}
          >
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

function AvatarUpload({
  onChange,
  error,
}: {
  onChange: (file: File | undefined) => void;
  error?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        return;
      if (file.size > 5 * 1024 * 1024) return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      onChange(file);
    },
    [onChange],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0] ?? null);
  };

  const clear = () => {
    setPreview(null);
    onChange(undefined);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-mono text-slate-400 tracking-widest uppercase">
        Avatar <span className="text-slate-600 normal-case">(optional)</span>
      </label>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !preview && inputRef.current?.click()}
        className={cn(
          "relative flex h-20 cursor-pointer items-center gap-4 rounded-lg border px-4 transition-all duration-200",
          preview
            ? "border-emerald-500/30 bg-emerald-950/10 cursor-default"
            : "border-slate-700 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-800/40",
        )}
      >
        {preview ? (
          <>
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-500/40">
              <Image
                src={preview}
                alt="Avatar preview"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300 truncate">Avatar selected</p>
              <p className="text-xs text-slate-500">Click × to remove</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
              className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-800 ring-1 ring-slate-700">
              <Upload className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">
                Drop image or{" "}
                <span className="text-emerald-400 underline underline-offset-2">
                  browse
                </span>
              </p>
              <p className="text-xs text-slate-600">
                JPEG, PNG, WEBP · Max 5 MB
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

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

// Main Component

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { mutate: register, isPending: isRegistering } = useRegister();
  const { mutate: googleAuth, isPending: isGooglePending } = useGoogleAuth();
  const { initiateGitHubLogin } = useGitHubAuth();

  const {
    register: field,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");
  const isLoading = isRegistering || isGooglePending;

  const onSubmit = (data: RegisterFormData) => register(data);

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    console.log(
      "Google OAuth successful, credential:",
      credentialResponse.credential,
    );
    if (credentialResponse.credential) {
      googleAuth(credentialResponse.credential);
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between p-12 overflow-hidden border-r border-slate-800/60">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Radial glow */}
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <Terminal className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <span className="font-mono text-lg font-semibold tracking-tight text-white">
              CTF<span className="text-emerald-400">Platform</span>
            </span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="font-mono text-xs tracking-[0.3em] text-emerald-400/80 uppercase">
              Capture The Flag
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight text-white leading-[1.1]">
              Sharpen your
              <br />
              <span className="text-emerald-400">hacking skills.</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Join thousands of security researchers solving challenges across
              web, crypto, forensics, and more.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 border-t border-slate-800/60 pt-8">
            {[
              { value: "12K+", label: "Players" },
              { value: "500+", label: "Challenges" },
              { value: "98", label: "Countries" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-mono text-2xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal snippet */}
        <div className="relative z-10">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 mb-3">
              {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
                <div
                  key={c}
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <pre className="font-mono text-xs text-slate-400 leading-relaxed">
              <span className="text-emerald-400">$</span> ctf login --user{" "}
              <span className="text-cyan-400">hacker</span>
              {"\n"}
              <span className="text-emerald-400">✓</span> Authenticated
              {"\n"}
              <span className="text-emerald-400">$</span> ctf solve --challenge
              web-01
              {"\n"}
              <span className="text-yellow-400">🩸 First blood!</span> +500 pts
            </pre>
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-md space-y-7">
          {/* Header */}
          <div className="space-y-1">
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30">
                <Terminal className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="font-mono text-base font-semibold text-white">
                CTF<span className="text-emerald-400">Platform</span>
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Create your account
            </h2>
            <p className="text-sm text-slate-500">
              Already have one?{" "}
              <Link
                href="/login"
                className="text-emerald-400 hover:text-emerald-300 transition-colors underline underline-offset-2"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Google */}
            <div className="[&>div]:!w-full [&>div>div]:!w-full [&_iframe]:!w-full">
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
                {/* Overlay label */}
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
            </div>

            {/* GitHub */}
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
              {/* <GitHub className="h-4 w-4" /> */}
              GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-slate-800" />
            <span className="mx-4 text-xs font-mono text-slate-600 shrink-0">
              or register with email
            </span>
            <div className="flex-1 border-t border-slate-800" />
          </div>

          {/* Register form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* Full name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-400 tracking-widest uppercase">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  {...field("fullName")}
                  placeholder="Osama Khan"
                  autoComplete="name"
                  className={cn(
                    "w-full rounded-lg border bg-slate-900/60 py-2.5 pl-9 pr-4 text-sm text-white",
                    "placeholder:text-slate-600 transition-all duration-200 outline-none",
                    "focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50",
                    errors.fullName
                      ? "border-red-500/60 focus:ring-red-500/20"
                      : "border-slate-700 hover:border-slate-600",
                  )}
                />
              </div>
              <FieldError message={errors.fullName?.message} />
            </div>

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
              <label className="block text-xs font-mono text-slate-400 tracking-widest uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  {...field("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
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
              <PasswordStrengthBar password={password ?? ""} />
              <FieldError message={errors.password?.message} />
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
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <FieldError message={errors.confirmPassword?.message} />
            </div>

            {/* Avatar */}
            <AvatarUpload
              onChange={(file) =>
                setValue("avatar", file, { shouldValidate: true })
              }
              error={errors.avatar?.message as string | undefined}
            />

            {/* Terms */}
            <p className="text-xs text-slate-600 leading-relaxed">
              By registering, you agree to our{" "}
              <Link
                href="/terms"
                className="text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
              >
                Privacy Policy
              </Link>
              .
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "relative w-full overflow-hidden rounded-lg px-4 py-2.5 text-sm font-semibold",
                "bg-emerald-500 text-slate-950 transition-all duration-200",
                "hover:bg-emerald-400 hover:shadow-[0_0_24px_rgba(52,211,153,0.25)]",
                "disabled:pointer-events-none disabled:opacity-60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60",
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Create account
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
