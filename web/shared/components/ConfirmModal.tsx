import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "./Modal";
import { cn } from "@/lib/utils";

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
    <Modal open={open} onClose={onClose} maxWidth="sm">
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
              variant === "danger"
                ? "bg-red-500/10 ring-red-500/20"
                : "bg-amber-500/10 ring-amber-500/20",
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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-700 py-2 text-sm font-medium text-slate-300 hover:border-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-colors disabled:opacity-60",
              variant === "danger"
                ? "bg-red-500 text-white hover:bg-red-400"
                : "bg-amber-500 text-slate-950 hover:bg-amber-400",
            )}
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
