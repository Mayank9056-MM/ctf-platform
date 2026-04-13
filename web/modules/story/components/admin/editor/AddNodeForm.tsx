import { cn } from "@/lib/utils";
import { NODE_TYPE_CONFIG } from "@/modules/story/config/admin-editor-ui.config";
import { useAdminCreateNode } from "@/modules/story/hooks/admin/node/useAdminCreateNode";
import {
  CreateNodeFormData,
  createNodeSchema,
} from "@/modules/story/schemas/story.schema";
import { NODE_TYPES } from "@/modules/story/types/story.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { motion } from "motion/react";

export function AddNodeForm({
  chapterId,
  storyId,
  onDone,
}: {
  chapterId: string;
  storyId: string;
  onDone: () => void;
}) {
  const { mutate: createNode, isPending } = useAdminCreateNode(
    storyId,
    chapterId,
  );
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<CreateNodeFormData>({
    resolver: zodResolver(createNodeSchema),
    defaultValues: {
      type: "cutscene",
      order: 1,
      isEntryPoint: false,
      isOptional: false,
      xpBonus: 0,
      unlockAfter: [],
    },
  });

  const type = watch("type");

  const onSubmit = (data: CreateNodeFormData) => {
    createNode(data, { onSuccess: onDone });
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
        <p className="font-mono text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          Add Node
        </p>

        {/* Type selector */}
        <div className="grid grid-cols-2 gap-2">
          {NODE_TYPES.map((t) => {
            const c = NODE_TYPE_CONFIG[t];
            return (
              <label
                key={t}
                className={cn(
                  "flex items-center gap-2 cursor-pointer rounded-lg border p-2.5 transition-all",
                  type === t
                    ? `${c.bg} ${c.ring} ring-1 border-transparent`
                    : "border-slate-700 hover:border-slate-600",
                )}
              >
                <input
                  type="radio"
                  value={t}
                  {...register("type")}
                  className="sr-only"
                />
                <c.Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    type === t ? c.color : "text-slate-600",
                  )}
                />
                <div>
                  <p
                    className={cn(
                      "text-xs font-medium",
                      type === t ? c.color : "text-slate-400",
                    )}
                  >
                    {c.label}
                  </p>
                  <p className="text-[10px] text-slate-600">{c.desc}</p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              Order
            </label>
            <input
              {...register("order", { valueAsNumber: true })}
              type="number"
              min={1}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              XP Bonus
            </label>
            <input
              {...register("xpBonus", { valueAsNumber: true })}
              type="number"
              min={0}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="flex items-end pb-1">
            <Controller
              name="isEntryPoint"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={!!field.value}
                      onChange={field.onChange}
                    />
                    <div className="h-4 w-7 rounded-full bg-slate-700 peer-checked:bg-emerald-500 transition-colors" />
                    <div className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white transition-transform peer-checked:translate-x-3" />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Entry point
                  </span>
                </label>
              )}
            />
          </div>
        </div>

        {/* Challenge ID for challenge nodes */}
        {type === "challenge" && (
          <div>
            <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              Challenge ID <span className="text-red-400">*</span>
            </label>
            <input
              {...register("challengeId")}
              placeholder="507f1f77bcf86cd799439011"
              className={cn(
                "w-full rounded-lg border bg-slate-900/60 px-2 py-1.5 font-mono text-xs text-white outline-none",
                errors.challengeId
                  ? "border-red-500/60"
                  : "border-slate-700 focus:border-emerald-500/50",
              )}
            />
            {errors.challengeId && (
              <p className="text-[10px] text-red-400 mt-0.5">
                {errors.challengeId.message}
              </p>
            )}
          </div>
        )}

        {/* Content / preNarrative for non-challenge */}
        {type !== "challenge" && (
          <div>
            <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              {type === "cutscene" || type === "briefing"
                ? "Content"
                : "Pre-narrative"}{" "}
              <span className="text-red-400">*</span>
            </label>
            <textarea
              {...register(type === "choice" ? "preNarrative" : "content")}
              rows={3}
              placeholder="Narrative text..."
              className={cn(
                "w-full rounded-lg border bg-slate-900/60 px-2 py-1.5 text-xs text-white placeholder:text-slate-600 outline-none resize-none",
                errors.content || errors.preNarrative
                  ? "border-red-500/60"
                  : "border-slate-700 focus:border-emerald-500/50",
              )}
            />
          </div>
        )}

        {/* Choices for choice nodes */}
        {type === "choice" && (
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-2.5">
            <p className="font-mono text-[10px] text-violet-400 mb-1">
              Add choice branches after creating the node (requires target node
              IDs)
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDone}
            className="flex-1 rounded-lg border border-slate-700 py-1.5 text-xs font-medium text-slate-400 hover:border-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-500 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            Add Node
          </button>
        </div>
      </div>
    </motion.form>
  );
}
