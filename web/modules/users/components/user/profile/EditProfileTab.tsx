import { useAuthStore } from "@/modules/auth/store/auth.store";
import { updateProfileApi } from "@/modules/users/api/user.api";
import {
  EditProfileData,
  editProfileSchema,
} from "@/modules/users/schema/user.schema";
import { UserProfile } from "@/modules/users/types/user.types";
import { ApiError } from "@/shared/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { inputCn } from "./ui/inputCn";
import { Field } from "./ui/Field";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export function EditProfileTab({ user }: { user: UserProfile }) {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EditProfileData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      username: user.username,
      fullName: user.fullName ?? "",
      bio: user.bio ?? "",
      country: user.country ?? "",
    },
  });

  const { mutate: update, isPending } = useMutation({
    mutationFn: (data: EditProfileData) => updateProfileApi(data),
    onSuccess: (updated) => {
      setUser(updated);
      qc.invalidateQueries({ queryKey: ["user", "current"] });
      toast.success("Profile updated.");
    },
    onError: (err: ApiError) => {
      if (err.statusCode === 409) toast.error("Username already taken.");
      else toast.error(err.message ?? "Update failed.");
    },
  });

  const COUNTRIES = [
    { code: "", label: "Select country" },
    { code: "IN", label: "India" },
    { code: "US", label: "United States" },
    { code: "GB", label: "United Kingdom" },
    { code: "DE", label: "Germany" },
    { code: "FR", label: "France" },
    { code: "CN", label: "China" },
    { code: "JP", label: "Japan" },
    { code: "RU", label: "Russia" },
    { code: "BR", label: "Brazil" },
    { code: "AU", label: "Australia" },
  ];

  return (
    <form onSubmit={handleSubmit((d) => update(d))} className="space-y-5">
      <div className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-700">
          Public Information
        </p>

        {/* Username */}
        <Field label="Username" error={errors.username?.message}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-700">
              @
            </span>
            <input
              {...register("username")}
              placeholder="your_handle"
              className={inputCn(!!errors.username, "pl-8")}
            />
          </div>
        </Field>

        {/* Full name */}
        <Field label="Display Name" error={errors.fullName?.message}>
          <input
            {...register("fullName")}
            placeholder="Alice Smith"
            className={inputCn(!!errors.fullName)}
          />
        </Field>

        {/* Bio */}
        <Field
          label="Bio"
          hint="Max 200 characters"
          error={errors.bio?.message}
        >
          <textarea
            {...register("bio")}
            rows={3}
            placeholder="CTF enthusiast. I break things."
            className={cn(inputCn(false), "resize-none")}
          />
        </Field>

        {/* Country */}
        <Field label="Country" error={errors.country?.message}>
          <select
            {...register("country")}
            className="w-full rounded-xl border border-white/[0.07] bg-[#0d1117] px-4 py-3 font-mono text-sm text-slate-300 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all cursor-pointer"
          >
            {COUNTRIES.map(({ code, label }) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <button
        type="submit"
        disabled={isPending || !isDirty}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 font-mono text-sm font-bold text-slate-950 hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.2)] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {isPending ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
