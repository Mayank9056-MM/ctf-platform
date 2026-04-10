import { AnimatePresence, motion } from "motion/react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm, UseFormRegister, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminUser } from "@/modules/admin/types/admin.types";
import { useAdminUpdateUser } from "@/modules/admin/hooks/user/useAdminUpdateUser";

type FieldProps = {
  name: keyof EditFormData;
  label: string;
  type?: string;
  register: UseFormRegister<EditFormData>;
  errors: FieldErrors<EditFormData>;
};

/**
 * A single form field component.
 *
 * @param {FieldProps} props - name, label, type, register, and errors
 * @returns {JSX.Element} - A single form field component
 *
 * @example
 * <Field name="username" label="Username" register={register} errors={errors} />
 */
const Field = ({
  name,
  label,
  type = "text",
  register,
  errors,
}: FieldProps) => (
  <div className="space-y-1.5">
    <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
      {label}
    </label>
    <input
      {...register(name)}
      type={type}
      className={cn(
        "w-full rounded-lg border bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none transition-all",
        errors[name]
          ? "border-red-500/60"
          : "border-slate-700 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20",
      )}
    />
    {errors[name] && (
      <p className="text-xs text-red-400">{String(errors[name]?.message)}</p>
    )}
  </div>
);

const editSchema = z.object({
  fullName: z.string().max(100).optional().or(z.literal("")),
  username: z.string().min(2).max(40).optional().or(z.literal("")),
  email: z.email().optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  country: z.string().max(60).optional().or(z.literal("")),
  isVerified: z.boolean().optional(),
});
type EditFormData = z.infer<typeof editSchema>;

/**
 * A modal component to edit a user.
 *
 * @param {object} props - Props containing:
 *   - open: Whether the modal is open or not.
 *   - user: The user to edit. If null, the modal will not be rendered.
 *   - onClose: Function to call when the modal is closed.
 */
export function EditUserModal({
  open,
  user,
  onClose,
}: {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
}) {
  const { mutate: update, isPending } = useAdminUpdateUser(user?._id ?? "");
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    values: user
      ? {
          fullName: user.fullName ?? "",
          username: user.username,
          email: user.email,
          bio: user.bio ?? "",
          country: user.country ?? "",
          isVerified: user.isVerified,
        }
      : undefined,
  });

  const onSubmit = (data: EditFormData) => {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== undefined),
    );
    update(cleaned, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
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
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="fixed inset-y-0 right-0 z-[70] flex"
          >
            <div className="w-full max-w-md h-full border-l border-slate-800 bg-[#0a0e15] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <div>
                  <h3 className="font-semibold text-white">Edit user</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {user.username}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex-1 overflow-y-auto p-6 space-y-4"
              >
                <Field
                  name="fullName"
                  label="Full Name"
                  register={register}
                  errors={errors}
                />

                <Field
                  name="username"
                  label="Username"
                  register={register}
                  errors={errors}
                />

                <Field
                  name="email"
                  label="Email"
                  type="email"
                  register={register}
                  errors={errors}
                />

                <Field
                  name="country"
                  label="Country"
                  register={register}
                  errors={errors}
                />
                
                <div className="space-y-1.5">
                  <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
                    Bio
                  </label>
                  <textarea
                    {...register("bio")}
                    rows={3}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none resize-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      {...register("isVerified")}
                      type="checkbox"
                      className="sr-only peer"
                    />
                    <div className="h-5 w-9 rounded-full bg-slate-700 peer-checked:bg-emerald-500 transition-colors" />
                    <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm text-slate-300">Email verified</span>
                </label>
              </form>
              <div className="border-t border-slate-800 p-6 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:border-slate-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-60"
                >
                  {isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Save changes
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
