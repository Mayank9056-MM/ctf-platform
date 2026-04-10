import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";

/**
 * A modal that prompts the user to confirm an action.
 *
 * @param {boolean} open - Whether the modal is open.
 * @param {() => void} onClose - A callback to close the modal.
 * @param {() => void} onConfirm - A callback to confirm the action.
 * @param {string} title - The title of the modal.
 * @param {string} description - The description of the modal.
 * @param {string} [confirmLabel="Confirm"] - The label of the confirm button.
 * @param {"danger" | "warning"} [variant="danger"] - The variant of the modal.
 * @param {boolean} [isPending=false] - Whether the confirm button is pending.
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "danger",
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
  isPending: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          >
            <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-[#0d1117] p-6 shadow-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    variant === "danger" ? "bg-red-500/10" : "bg-amber-500/10",
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "h-4 w-4",
                      variant === "danger" ? "text-red-400" : "text-amber-400",
                    )}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-medium text-slate-300 hover:border-slate-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isPending}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors disabled:opacity-60",
                    variant === "danger"
                      ? "bg-red-500 text-white hover:bg-red-400"
                      : "bg-amber-500 text-slate-950 hover:bg-amber-400",
                  )}
                >
                  {isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
