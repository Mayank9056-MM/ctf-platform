import { Ban, Crown, Edit3, Loader2, Trash2, UserCheck, X } from "lucide-react";
import { useAdminUser } from "../../hooks/user/useAdminUser";
import { UserAvatar } from "./UserAvatar";
import { RoleBadge } from "./RoleBadge";
import { StatusBadge } from "./StatusBadge";
import { motion } from "motion/react";
import { fmt } from "@/shared/utils/fmt";
import { formatDate } from "@/shared/utils/formdate";
import { timeAgo } from "@/shared/utils/time";

/**
 * A panel to display a user's detail.
 *
 * @param {string} userId - The user's ID.
 * @param {() => void} onClose - A callback to close the panel.
 * @param {boolean} isSuperAdmin - Whether the current user is a super admin.
 * @param {() => void} onEdit - A callback to edit the user's profile.
 * @param {() => void} onBan - A callback to ban the user.
 * @param {() => void} onUnban - A callback to unban the user.
 * @param {() => void} onChangeRole - A callback to change the user's role.
 * @param {() => void} onDelete - A callback to delete and anonymize the user.
 */
export function UserDetailPanel({
  userId,
  onClose,
  isSuperAdmin,
  onEdit,
  onBan,
  onUnban,
  onChangeRole,
  onDelete,
}: {
  userId: string;
  onClose: () => void;
  isSuperAdmin: boolean;
  onEdit: () => void;
  onBan: () => void;
  onUnban: () => void;
  onChangeRole: () => void;
  onDelete: () => void;
}) {
  const { data: user, isLoading } = useAdminUser(userId);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-y-0 right-0 z-30 w-full max-w-sm border-l border-slate-800 bg-[#0a0e15] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 shrink-0">
        <h3 className="font-mono text-sm font-semibold text-white">
          User Detail
        </h3>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-5 w-5 text-slate-500 animate-spin" />
        </div>
      )}

      {user && (
        <div className="flex-1 overflow-y-auto">
          {/* Profile header */}
          <div className="p-5 border-b border-slate-800/60 space-y-4">
            <div className="flex items-start gap-3">
              <UserAvatar user={user} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-mono font-semibold text-white truncate">
                    {user.username}
                  </p>
                  <RoleBadge role={user.role} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {user.email}
                </p>
                {user.fullName && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {user.fullName}
                  </p>
                )}
                <div className="mt-2">
                  <StatusBadge
                    isBanned={user.isBanned}
                    isVerified={user.isVerified}
                  />
                </div>
              </div>
            </div>

            {/* Score strip */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Score", value: fmt(user.score) },
                {
                  label: "Solved",
                  value: fmt(user.solvedChallenges?.length ?? 0),
                },
                { label: "Submissions", value: fmt(user.submissionCount ?? 0) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-slate-800 bg-slate-900/40 px-2 py-2 text-center"
                >
                  <p className="font-mono text-sm font-bold text-white tabular-nums">
                    {s.value}
                  </p>
                  <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="p-5 space-y-3 border-b border-slate-800/60">
            {[
              { label: "User ID", value: user._id },
              { label: "Country", value: user.country ?? "—" },
              { label: "Last active", value: timeAgo(user.lastActive) },
              { label: "Joined", value: formatDate(user.createdAt) },
              { label: "Team", value: user?.teamId?._id ?? "No team" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-xs">
                <span className="text-slate-500 font-mono">{row.label}</span>
                <span className="text-slate-300 font-mono truncate max-w-[160px] text-right">
                  {row.value}
                </span>
              </div>
            ))}
            {user.bio && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3">
                <p className="text-[11px] text-slate-500 font-mono uppercase tracking-wider mb-1">
                  Bio
                </p>
                <p className="text-xs text-slate-300">{user.bio}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-5 space-y-2">
            <p className="font-mono text-[10px] tracking-[0.2em] text-slate-600 uppercase mb-3">
              Actions
            </p>

            <button
              onClick={onEdit}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-800 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all"
            >
              <Edit3 className="h-4 w-4 text-slate-500" />
              Edit profile
            </button>
            <button
              onClick={onChangeRole}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-800 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all"
            >
              <Crown className="h-4 w-4 text-slate-500" />
              Change role
            </button>
            {user.isBanned ? (
              <button
                onClick={onUnban}
                className="flex w-full items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-all"
              >
                <UserCheck className="h-4 w-4" />
                Unban user
              </button>
            ) : (
              <button
                onClick={onBan}
                className="flex w-full items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-all"
              >
                <Ban className="h-4 w-4" />
                Ban user
              </button>
            )}
            {isSuperAdmin && (
              <button
                onClick={onDelete}
                className="flex w-full items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 className="h-4 w-4" />
                Delete & anonymise
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
