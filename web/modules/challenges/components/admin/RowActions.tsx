import { useState } from "react";
import { AdminChallenge } from "../../types/challenge.types";
import { Eye, EyeOff, FileText, MoreHorizontal, Trash2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export function RowActions({
  challenge,
  isSuperAdmin,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
}: {
  challenge: AdminChallenge;
  isSuperAdmin: boolean;
  onEdit: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-colors"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 z-20 mt-1 w-40 rounded-xl border border-slate-800 bg-[#0d1117] py-1.5 shadow-2xl"
            >
              {[
                { label: "Edit", icon: FileText, onClick: onEdit, color: "" },
                challenge?.isVisible
                  ? {
                      label: "Unpublish",
                      icon: EyeOff,
                      onClick: onUnpublish,
                      color: "text-amber-400",
                    }
                  : {
                      label: "Publish",
                      icon: Eye,
                      onClick: onPublish,
                      color: "text-emerald-400",
                    },
                ...(isSuperAdmin
                  ? [
                      {
                        label: "Delete",
                        icon: Trash2,
                        onClick: onDelete,
                        color: "text-red-400",
                      },
                    ]
                  : []),
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-slate-800/60",
                    action.color || "text-slate-300",
                  )}
                >
                  <action.icon
                    className={cn(
                      "h-3.5 w-3.5",
                      action.color || "text-slate-500",
                    )}
                  />
                  {action.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
