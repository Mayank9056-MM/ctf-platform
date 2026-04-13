import { useAdminCreateChapter } from "@/modules/story/hooks/admin/chapter/useAdminCreateChapter";
import {
  CreateChapterFormData,
  createChapterSchema,
} from "@/modules/story/schemas/story.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";

export function AddChapterForm({
  storyId,
  currentChapterCount,
  onDone,
}: {
  storyId: string;
  currentChapterCount: number;
  onDone: () => void;
}) {
  const { mutate: createChapter, isPending } = useAdminCreateChapter(storyId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateChapterFormData>({
    resolver: zodResolver(createChapterSchema),
    defaultValues: { order: currentChapterCount + 1, unlockAfterChapters: [] },
  });

  const onSubmit = (data: CreateChapterFormData) => {
    createChapter(data, { onSuccess: onDone });
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="overflow-hidden"
    >
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-4">
        <p className="font-mono text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          New Chapter
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className="block font-mono text-[11px] text-slate-500 uppercase tracking-wider">
              Title
            </label>
            <input
              {...register("title")}
              placeholder="The Awakening"
              className={cn(
                "w-full rounded-xl border bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none transition-all",
                errors.title
                  ? "border-red-500/60"
                  : "border-slate-700 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15",
              )}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] text-slate-500 uppercase tracking-wider">
              Order
            </label>
            <input
              {...register("order", { valueAsNumber: true })}
              type="number"
              min={1}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] text-slate-500 uppercase tracking-wider">
            Opening Narrative{" "}
            <span className="normal-case text-slate-700">(opt)</span>
          </label>
          <textarea
            {...register("openingNarrative")}
            rows={2}
            placeholder="Scene-setting text shown before the chapter begins..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none resize-none focus:border-emerald-500/50 transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] text-slate-500 uppercase tracking-wider">
              Est. Minutes{" "}
              <span className="normal-case text-slate-700">(opt)</span>
            </label>
            <input
              {...register("estimatedMinutes", { valueAsNumber: true })}
              type="number"
              min={1}
              placeholder="30"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] text-slate-500 uppercase tracking-wider">
              Accent Color
            </label>
            <input
              {...register("accentColor")}
              type="color"
              defaultValue="#10b981"
              className="h-10 w-full cursor-pointer rounded-xl border border-slate-700 bg-transparent p-1"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDone}
            className="flex-1 rounded-xl border border-slate-700 py-2 text-sm font-medium text-slate-400 hover:border-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Create Chapter
          </button>
        </div>
      </div>
    </motion.form>
  );
}
