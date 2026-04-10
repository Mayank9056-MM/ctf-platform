import { useRef, useState } from "react";
import { AdminUser } from "../../types/admin.types";
import { Ban, Crown, Edit3, MoreHorizontal, Trash2, UserCheck } from "lucide-react";
import { AnimatePresence } from "motion/react";
import {motion} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * A component to display a dropdown menu with actions related to a user.
 *
 * @param {AdminUser} user - The user to display actions for.
 * @param {boolean} isSuperAdmin - Whether the current user is a super admin.
 * @param {() => void} onEdit - A callback to edit the user's profile.
 * @param {() => void} onBan - A callback to ban the user.
 * @param {() => void} onUnban - A callback to unban the user.
 * @param {() => void} onChangeRole - A callback to change the user's role.
 * @param {() => void} onDelete - A callback to delete and anonymize the user.
 */
export function RowActions({
  user,
  isSuperAdmin,
  onEdit,
  onBan,
  onUnban,
  onChangeRole,
  onDelete,
}: {
  user: AdminUser;
  isSuperAdmin: boolean;
  onEdit: () => void;
  onBan: () => void;
  onUnban: () => void;
  onChangeRole: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
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
              className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-800 bg-[#0d1117] py-1.5 shadow-2xl"
            >
              {[
                { icon: Edit3, label: "Edit user", onClick: onEdit, color: "" },
                {
                  icon: Crown,
                  label: "Change role",
                  onClick: onChangeRole,
                  color: "",
                },
                ...(user.isBanned
                  ? [
                      {
                        icon: UserCheck,
                        label: "Unban",
                        onClick: onUnban,
                        color: "text-emerald-400",
                      },
                    ]
                  : [
                      {
                        icon: Ban,
                        label: "Ban user",
                        onClick: onBan,
                        color: "text-amber-400",
                      },
                    ]),
                ...(isSuperAdmin
                  ? [
                      {
                        icon: Trash2,
                        label: "Delete user",
                        onClick: onDelete,
                        color: "text-red-400",
                      },
                    ]
                  : []),
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
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