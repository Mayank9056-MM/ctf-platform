import { useChangePassword } from "@/modules/auth/hooks/useChangePassword";
import { useRevokeAllSessions } from "@/modules/refreshToken/hooks/useRevokeAllSessions";
import { useRevokeSession } from "@/modules/refreshToken/hooks/useRevokeSession";
import { useSessions } from "@/modules/refreshToken/hooks/useSessions";
import { ChangePasswordData, changePasswordSchema } from "@/modules/users/schema/user.schema";
import { UserProfile } from "@/modules/users/types/user.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Field } from "./ui/Field";
import { PasswordInput } from "./ui/PasswordInput";
import { Key, Loader2, LogOut, Monitor, Smartphone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export function SecurityTab({ user }: { user: UserProfile }) {
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});
  const hasLocal = user.providers?.some((p) => p.provider === "local");
 
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
  });
 
  const { mutate: changePw, isPending: isChangingPw } = useChangePassword()
 
  const { sessions, devices, count, isLoading: loadingSessions } = useSessions();
  const { mutate: revoke, isPending: isRevoking } = useRevokeSession();
  const { mutate: revokeAll, isPending: isRevokingAll } = useRevokeAllSessions();
 
  return (
    <div className="space-y-5">
      {/* Change password (local accounts only) */}
      {hasLocal && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-700">Change Password</p>
 
          <form onSubmit={handleSubmit((d) => changePw(d))} className="space-y-4">
            <Field label="Current Password" error={errors.oldPassword?.message}>
              <PasswordInput name="oldPassword" register={register} show={!!showPw["old"]} onToggle={() => setShowPw((p) => ({ ...p, old: !p.old }))} />
            </Field>
            <Field label="New Password" error={errors.newPassword?.message}>
              <PasswordInput name="newPassword" register={register} show={!!showPw["new"]} onToggle={() => setShowPw((p) => ({ ...p, new: !p.new }))} />
            </Field>
            <Field label="Confirm New Password" error={errors.confirmPassword?.message}>
              <PasswordInput name="confirmPassword" register={register} show={!!showPw["confirm"]} onToggle={() => setShowPw((p) => ({ ...p, confirm: !p.confirm }))} />
            </Field>
 
            <button type="submit" disabled={isChangingPw}
              className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-5 py-3 font-mono text-sm text-slate-300 hover:bg-white/[0.09] hover:text-white disabled:opacity-50 transition-all">
              {isChangingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
              Update Password
            </button>
          </form>
        </div>
      )}
 
      {/* Active sessions */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-6 space-y-4 animate-in fade-in duration-500"
        style={{ animationDelay: "100ms", animationFillMode: "both" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-700">Active Sessions</p>
            <p className="font-mono text-xs text-slate-600 mt-0.5">{count} device{count !== 1 ? "s" : ""}</p>
          </div>
          {count > 1 && (
            <button onClick={() => revokeAll()} disabled={isRevokingAll}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-950/10 px-3 py-1.5 font-mono text-[10px] text-red-400 hover:bg-red-950/25 disabled:opacity-50 transition-all">
              {isRevokingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
              Sign out all
            </button>
          )}
        </div>
 
        {loadingSessions ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {devices.map((d) => (
              <div key={d.sessionId}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
                  d.isCurrent ? "border-emerald-500/15 bg-emerald-950/10" : "border-white/[0.05] bg-white/[0.02]"
                )}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
                  {d.os === "iOS" || d.os === "Android"
                    ? <Smartphone className="h-4 w-4 text-slate-500" />
                    : <Monitor className="h-4 w-4 text-slate-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-slate-300">{d.browser} · {d.os}</p>
                    {d.isCurrent && <span className="font-mono text-[9px] text-emerald-500">current</span>}
                  </div>
                  <p className="font-mono text-[10px] text-slate-700">
                    {d.ip ?? "Unknown IP"} · Active {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!d.isCurrent && (
                  <button onClick={() => revoke(d.sessionId)} disabled={isRevoking}
                    className="shrink-0 rounded-lg p-1.5 text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
 
      {/* Account danger zone */}
      <div className="rounded-2xl border border-red-500/15 bg-red-950/5 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-400/60 mb-3">Danger Zone</p>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-slate-400">Delete Account</p>
            <p className="font-mono text-[10px] text-slate-700">Permanently delete your account and all data</p>
          </div>
          <button
            className="rounded-xl border border-red-500/20 px-4 py-2 font-mono text-xs text-red-400/70 hover:border-red-500/40 hover:text-red-400 transition-all"
            onClick={() => toast.error("Contact support to delete your account.")}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
 