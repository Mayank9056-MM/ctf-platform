import { z } from "zod";
import { AdminUser } from "../../types/admin.types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAdminBanUser } from "../../hooks/user/useAdminBanUser";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const banSchema = z.object({
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

/**
 * A modal to ban a user.
 *
 * @param {boolean} open - Whether the modal is open.
 * @param {AdminUser | null} user - The user to ban.
 * @param {() => void} onClose - Callback to close the modal.
 */
export function BanModal({
  open,
  user,
  onClose,
}: {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ reason: string }>({
    resolver: zodResolver(banSchema),
  });

  const { mutate: ban, isPending } = useAdminBanUser(user?._id ?? "");

  const onSubmit = (data: { reason: string }) => {
    ban(
      { reason: data.reason },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
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
            <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-[#0d1117] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">
                  Ban {user.username}
                </h3>
                <button
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
                    Reason
                  </label>
                  <textarea
                    {...register("reason")}
                    rows={3}
                    placeholder="Reason for ban..."
                    className={cn(
                      "w-full rounded-lg border bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none resize-none transition-all",
                      errors.reason
                        ? "border-red-500/60"
                        : "border-slate-700 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20",
                    )}
                  />
                  {errors.reason && (
                    <p className="text-xs text-red-400">
                      {errors.reason.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-medium text-slate-300 hover:border-slate-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white hover:bg-red-400 transition-colors disabled:opacity-60"
                  >
                    {isPending && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Ban user
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
