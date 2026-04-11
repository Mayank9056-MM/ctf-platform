import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Flag, Loader2, X } from "lucide-react";
import { motion } from "motion/react";
import { z } from "zod";
import { CHALLENGE_CATEGORIES, CHALLENGE_DIFFICULTIES } from "@/modules/challenges/types/challenge.types";
import { useCreateChallenge } from "@/modules/challenges/hooks/admin/useCreateChallenge";
import { useUpdateChallenge } from "@/modules/challenges/hooks/admin/useUpdateChallenge";

// Zod schema

const createSchema = z.object({
  title: z.string().min(3, "Min 3 characters").max(100, "Max 100 characters"),
  description: z
    .string()
    .min(10, "Min 10 characters")
    .max(10000, "Max 10,000 characters"),
  category: z.enum(CHALLENGE_CATEGORIES),
  difficulty: z.enum(CHALLENGE_DIFFICULTIES),
  points: z.coerce
    .number()
    .min(1, "Must be at least 1")
    .max(10000, "Max 10,000"),
  flag: z.string().min(1, "Flag is required").max(500, "Max 500 characters"),
  scoringType: z.enum(["static", "dynamic"]).default("dynamic"),
  minPoints: z.coerce.number().min(0).max(10000).optional(),
  isCaseSensitive: z.boolean().default(true),
  isHosted: z.boolean().default(false),
  tags: z.string().optional(), // comma-separated
});

const updateSchema = createSchema.omit({ flag: true }).extend({
  flag: z.string().max(500).optional().or(z.literal("")),
  isVisible: z.boolean().optional(),
  flagFormat: z.string().max(50).optional().or(z.literal("")),
  closedAt: z.string().optional().or(z.literal("")),
});

const hintSchema = z.object({
  text: z.string().min(1, "Hint text required").max(500),
  cost: z.coerce.number().min(0, "Cost cannot be negative"),
  order: z.coerce.number().min(1, "Order must be at least 1"),
});

type CreateFormData = z.infer<typeof createSchema>;
type UpdateFormData = z.infer<typeof updateSchema>;
type HintFormData = z.infer<typeof hintSchema>;

export function ChallengeFormPanel({
  mode,
  challenge,
  onClose,
}: {
  mode: "create" | "edit";
  challenge?: AdminChallenge;
  onClose: () => void;
}) {
  const { mutate: create, isPending: isCreating } = useCreateChallenge();
  const { mutate: update, isPending: isUpdating } = useUpdateChallenge(
    challenge?._id ?? "",
  );
  const isPending = isCreating || isUpdating;

  const schema = mode === "create" ? createSchema : updateSchema;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === "edit" && challenge
        ? {
            title: challenge.title,
            description: challenge.description,
            category: challenge.category,
            difficulty: challenge.difficulty,
            points: challenge.points,
            flag: "",
            scoringType: challenge.scoringType,
            minPoints: challenge.minPoints,
            isCaseSensitive: challenge.isCaseSensitive,
            isHosted: challenge.isHosted,
            tags: challenge.tags.join(", "),
            isVisible: challenge.isVisible,
            flagFormat: challenge.flagFormat ?? "",
          }
        : {
            scoringType: "dynamic",
            isCaseSensitive: true,
            isHosted: false,
          },
  });

  const scoringType = watch("scoringType");

  const onSubmit = (data: CreateFormData | UpdateFormData) => {
    const tags = data.tags
      ? data.tags
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [];

    const payload = { ...data, tags };

    if (mode === "create") {
      create(payload, { onSuccess: onClose });
    } else {
      // Strip empty flag
      const { flag, ...rest } = payload;
      update(flag ? { ...rest, flag } : rest, { onSuccess: onClose });
    }
  };

  const Field = ({
    name,
    label,
    type = "text",
    placeholder,
    hint,
  }: {
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
    hint?: string;
  }) => {
    const err = (errors as Record<string, { message?: string }>)[name];
    return (
      <div className="space-y-1.5">
        <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
          {label}
        </label>
        <input
          {...register(name)}
          type={type}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-lg border bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none transition-all",
            err
              ? "border-red-500/60 focus:ring-red-500/20"
              : "border-slate-700 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20",
          )}
        />
        {hint && !err && <p className="text-[11px] text-slate-600">{hint}</p>}
        {err && <p className="text-xs text-red-400">{err.message}</p>}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-800 bg-[#070d1a] shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0">
        <div>
          <h2 className="font-semibold text-white">
            {mode === "create" ? "Create Challenge" : "Edit Challenge"}
          </h2>
          {challenge && (
            <p className="font-mono text-xs text-slate-500 mt-0.5 truncate max-w-[280px]">
              {challenge.title}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 overflow-y-auto p-6 space-y-5"
      >
        <Field name="title" label="Title" placeholder="SQL Injection 101" />

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
            Description
          </label>
          <textarea
            {...register("description")}
            rows={5}
            placeholder="Challenge description, supports Markdown..."
            className={cn(
              "w-full rounded-lg border bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none resize-none transition-all",
              errors.description
                ? "border-red-500/60"
                : "border-slate-700 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20",
            )}
          />
          {errors.description && (
            <p className="text-xs text-red-400">{errors.description.message}</p>
          )}
        </div>

        {/* Category + Difficulty */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
              Category
            </label>
            <select
              {...register("category")}
              className={cn(
                "w-full rounded-lg border bg-slate-900/60 px-3 py-2 text-sm text-slate-300 outline-none transition-all",
                errors.category
                  ? "border-red-500/60"
                  : "border-slate-700 focus:border-emerald-500/50",
              )}
            >
              <option value="">Select...</option>
              {CHALLENGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-red-400">Required</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
              Difficulty
            </label>
            <select
              {...register("difficulty")}
              className={cn(
                "w-full rounded-lg border bg-slate-900/60 px-3 py-2 text-sm text-slate-300 outline-none transition-all",
                errors.difficulty
                  ? "border-red-500/60"
                  : "border-slate-700 focus:border-emerald-500/50",
              )}
            >
              <option value="">Select...</option>
              {CHALLENGE_DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.difficulty && (
              <p className="text-xs text-red-400">Required</p>
            )}
          </div>
        </div>

        {/* Points + Scoring */}
        <div className="grid grid-cols-2 gap-4">
          <Field
            name="points"
            label="Base Points"
            type="number"
            placeholder="500"
          />
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
              Scoring Type
            </label>
            <select
              {...register("scoringType")}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 outline-none focus:border-emerald-500/50"
            >
              <option value="dynamic">Dynamic (decay)</option>
              <option value="static">Static</option>
            </select>
          </div>
        </div>

        {scoringType === "dynamic" && (
          <Field
            name="minPoints"
            label="Minimum Points (decay floor)"
            type="number"
            placeholder="10"
            hint="Score won't decay below this value"
          />
        )}

        {/* Flag */}
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
            Flag{" "}
            {mode === "edit" && (
              <span className="normal-case text-slate-600">
                (leave blank to keep current)
              </span>
            )}
          </label>
          <div className="relative">
            <Flag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            <input
              {...register("flag")}
              type="text"
              placeholder="CTF{...}"
              className={cn(
                "w-full rounded-lg border bg-slate-900/60 py-2 pl-9 pr-4 text-sm text-white font-mono placeholder:text-slate-600 outline-none transition-all",
                errors.flag
                  ? "border-red-500/60"
                  : "border-slate-700 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20",
              )}
            />
          </div>
          {errors.flag && (
            <p className="text-xs text-red-400">{errors.flag.message}</p>
          )}
        </div>

        {/* Flag format hint */}
        {mode === "edit" && (
          <Field
            name="flagFormat"
            label="Flag Format Hint (optional)"
            placeholder="CTF{...}"
            hint="Shown to players as a hint about flag format"
          />
        )}

        <Field
          name="tags"
          label="Tags"
          placeholder="sqli, injection, beginner"
          hint="Comma-separated tags"
        />

        {/* Toggles */}
        <div className="space-y-3 border-t border-slate-800/60 pt-4">
          {[
            { name: "isCaseSensitive", label: "Case-sensitive flag" },
            { name: "isHosted", label: "Hosted challenge (Docker)" },
            ...(mode === "edit"
              ? [{ name: "isVisible", label: "Visible to players" }]
              : []),
          ].map((toggle) => (
            <Controller
              key={toggle.name}
              name={toggle.name}
              control={control}
              render={({ field }) => (
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                    {toggle.label}
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={!!field.value}
                      onChange={field.onChange}
                    />
                    <div className="h-5 w-9 rounded-full bg-slate-700 peer-checked:bg-emerald-500 transition-colors" />
                    <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
                  </div>
                </label>
              )}
            />
          ))}
        </div>
      </form>

      {/* Footer */}
      <div className="border-t border-slate-800 p-6 flex gap-3 shrink-0">
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
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {mode === "create" ? "Create challenge" : "Save changes"}
        </button>
      </div>
    </motion.div>
  );
}
