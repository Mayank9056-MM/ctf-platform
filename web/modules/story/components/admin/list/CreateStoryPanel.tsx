import { useAdminCreateStory } from "@/modules/story/hooks/admin/useAdminCreateStory";
import {
  CreateStoryFormData,
  createStorySchema,
} from "@/modules/story/schemas/story.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "motion/react";
import { BookOpen, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { STORY_DIFFICULTIES } from "@/modules/story/types/story.types";
import { DIFF_CONFIG } from "@/modules/story/config/admin-list-ui.config";

export function CreateStoryPanel({ onClose }: { onClose: () => void }) {
  const { mutate: create, isPending } = useAdminCreateStory();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateStoryFormData>({
    resolver: zodResolver(createStorySchema),
    defaultValues: { difficulty: "medium", completionXpBonus: 0, tags: [] },
  });

  const onSubmit = (data: CreateStoryFormData) => {
    const tags =
      typeof data.tags === "string"
        ? data.tags
            .split(",")
            .map((t: string) => t.trim().toLowerCase())
            .filter(Boolean)
        : data.tags;
    create({ ...data, tags }, { onSuccess: onClose });
  };

  const FieldErr = ({ name }: { name: string }) => {
    const err = errors[name];
    return err ? (
      <p className="text-xs text-red-400 mt-1">{err.message}</p>
    ) : null;
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-800 bg-[#060b14] shadow-2xl"
    >
      {/* Cinematic header */}
      <div className="relative overflow-hidden border-b border-slate-800 px-6 py-5 shrink-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <BookOpen className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">New Story Arc</h2>
              <p className="font-mono text-[10px] text-slate-600 uppercase tracking-wider">
                Create narrative
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 overflow-y-auto p-6 space-y-5"
      >
        {/* Title */}
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
            Story Title
          </label>
          <input
            {...register("title")}
            placeholder="Operation Shadow Protocol"
            className={cn(
              "w-full rounded-xl border bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all",
              errors.title
                ? "border-red-500/60"
                : "border-slate-700 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15",
            )}
          />
          <FieldErr name="title" />
        </div>

        {/* Tagline */}
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
            Tagline <span className="normal-case text-slate-700">(opt)</span>
          </label>
          <input
            {...register("tagline")}
            placeholder="A short hook shown on the story card..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 transition-all"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
            Description{" "}
            <span className="normal-case text-slate-700">(opt)</span>
          </label>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Full story synopsis shown to players before they start..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none resize-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 transition-all"
          />
        </div>

        {/* Difficulty + XP */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
              Difficulty
            </label>
            <select
              {...register("difficulty")}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-emerald-500/50"
            >
              {STORY_DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {DIFF_CONFIG[d].label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
              XP Bonus
            </label>
            <input
              {...register("completionXpBonus", { valueAsNumber: true })}
              type="number"
              placeholder="0"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 transition-all"
            />
          </div>
        </div>

        {/* Estimated minutes */}
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
            Estimated Time{" "}
            <span className="normal-case text-slate-700">(minutes, opt)</span>
          </label>
          <input
            {...register("estimatedMinutes", { valueAsNumber: true })}
            type="number"
            placeholder="90"
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 transition-all"
          />
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
            Tags{" "}
            <span className="normal-case text-slate-700">
              (comma-separated)
            </span>
          </label>
          <input
            {...register("tags")}
            placeholder="cryptography, web, beginner-friendly"
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 transition-all"
          />
        </div>

        {/* Cover + Accent */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
              Cover URL{" "}
              <span className="normal-case text-slate-700">(opt)</span>
            </label>
            <input
              {...register("coverImageUrl")}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] tracking-widest text-slate-500 uppercase">
              Accent Color
            </label>
            <div className="flex gap-2">
              <input
                {...register("accentColor")}
                type="color"
                defaultValue="#10b981"
                className="h-10 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
              />
              <input
                {...register("accentColor")}
                placeholder="#10b981"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 font-mono text-xs text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>
        </div>
      </form>

      <div className="border-t border-slate-800 p-6 flex gap-3 shrink-0">
        <button
          onClick={onClose}
          className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:border-slate-500 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <BookOpen className="h-3.5 w-3.5" />
          )}
          Create Story
        </button>
      </div>
    </motion.div>
  );
}
