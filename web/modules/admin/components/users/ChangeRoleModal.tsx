import { useState } from "react";
import { AdminUser, UserRole } from "../../types/admin.types";
import { useAdminChangeRole } from "../../hooks/user/useAdminChangeRole";
import { AnimatePresence, motion } from "motion/react";
import { ROLE_CONFIG } from "../../constants/admin.constants";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A modal to change the role of a user.
 *
 * @param {boolean} open - Whether the modal is open.
 * @param {AdminUser | null} user - The user to change the role of.
 * @param {() => void} onClose - A callback to close the modal.
 * @param {boolean} isSuperAdmin - Whether the current user is a super admin.
 */
export function ChangeRoleModal({
  open,
  user,
  onClose,
  isSuperAdmin,
}: {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  isSuperAdmin: boolean;
}) {
  const [role, setRole] = useState<UserRole>("user");
  const { mutate: changeRole, isPending } = useAdminChangeRole();

  const available: UserRole[] = isSuperAdmin
    ? ["user", "admin", "superadmin"]
    : ["user", "admin"];

  const onConfirm = () => {
    if (!user) return;
    changeRole({ userId: user._id, payload: { role } }, { onSuccess: onClose });
  };

  return (
    <AnimatePresence>
      {open && user && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          >
            <div className="w-full max-w-xs rounded-2xl border border-slate-800 bg-[#0d1117] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Change role</h3>
                <button
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Changing role for{" "}
                <span className="text-slate-200 font-mono">
                  {user.username}
                </span>
              </p>
              <div className="space-y-2">
                {available.map((r) => {
                  const c = ROLE_CONFIG[r];
                  return (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-all",
                        role === r
                          ? `${c.bg} ${c.ring} ring-1 ${c.color}`
                          : "border-slate-800 text-slate-400 hover:border-slate-700",
                      )}
                    >
                      <span className="font-medium">{c.label}</span>
                      {role === r && <CheckCircle2 className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-medium text-slate-300 hover:border-slate-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isPending || role === user.role}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-60"
                >
                  {isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
