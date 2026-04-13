import { cn } from "@/lib/utils";
import { useAdminAddCharacter } from "@/modules/story/hooks/admin/useAdminAddCharacter";
import {
  AddCharacterFormData,
  addCharacterSchema,
} from "@/modules/story/schemas/story.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { motion } from "motion/react";

export function AddCharacterForm({
  storyId,
  onDone,
}: {
  storyId: string;
  onDone: () => void;
}) {
  const { mutate: addChar, isPending } = useAdminAddCharacter(storyId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddCharacterFormData>({
    resolver: zodResolver(addCharacterSchema),
  });

  const onSubmit = (data: AddCharacterFormData) => {
    addChar(data, { onSuccess: onDone });
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3">
        <p className="font-mono text-[10px] font-semibold text-violet-400 uppercase tracking-wider">
          New Character
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              ID <span className="text-red-400">*</span>
            </label>
            <input
              {...register("id")}
              placeholder="agent_zero"
              className={cn(
                "w-full rounded-lg border bg-slate-900/60 px-2.5 py-2 text-xs font-mono text-white placeholder:text-slate-600 outline-none",
                errors.id
                  ? "border-red-500/60"
                  : "border-slate-700 focus:border-violet-500/50",
              )}
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              {...register("name")}
              placeholder="Agent Zero"
              className={cn(
                "w-full rounded-lg border bg-slate-900/60 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 outline-none",
                errors.name
                  ? "border-red-500/60"
                  : "border-slate-700 focus:border-violet-500/50",
              )}
            />
          </div>
        </div>
        <div>
          <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
            Avatar URL <span className="normal-case text-slate-700">(opt)</span>
          </label>
          <input
            {...register("avatarUrl")}
            placeholder="https://..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50"
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
            Bio <span className="normal-case text-slate-700">(opt)</span>
          </label>
          <textarea
            {...register("bio")}
            rows={2}
            placeholder="Character background..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-2.5 py-2 text-xs text-white placeholder:text-slate-600 outline-none resize-none focus:border-violet-500/50"
          />
        </div>
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
            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-violet-500 py-1.5 text-xs font-bold text-white hover:bg-violet-400 disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            Add
          </button>
        </div>
      </div>
    </motion.form>
  );
}
