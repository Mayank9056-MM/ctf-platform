import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { AdminChallenge } from "@/modules/challenges/types/challenge.types";
import { useAddHint } from "@/modules/challenges/hooks/admin/useAddHint";
import { useRemoveHint } from "@/modules/challenges/hooks/admin/useRemoveHint";
import {
  AddHintFormData,
  addHintSchema,
} from "@/modules/challenges/schemas/challenge.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * A component to manage hints for a challenge.
 * Allows admins to add and remove hints.
 * @param {{ challenge: AdminChallenge }} - The challenge to manage hints for.
 * @returns {JSX.Element} - A JSX element representing the hint manager.
 */
export function HintManager({ challenge }: { challenge: AdminChallenge }) {
  const { mutate: addHint, isPending: isAdding } = useAddHint(challenge._id);
  const { mutate: removeHint, isPending: isRemoving } = useRemoveHint(
    challenge._id,
  );
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddHintFormData>({ resolver: zodResolver(addHintSchema) });

  const onAdd = (data: AddHintFormData) => {
    console.log(data);
    console.log("calling addHint");
    addHint(data, {
      onSuccess: () => {
        reset();
        setShowForm(false);
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] tracking-[0.2em] text-slate-600 uppercase">
          Hints ({challenge.hints.length})
        </p>
        <Button
          variant="outline"
          onClick={() => setShowForm((v) => !v)}
          className="h-auto flex items-center gap-1 rounded-md border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <Plus className="h-2.5 w-2.5" />
          Add
        </Button>
      </div>

      {/* Existing hints */}
      <div className="space-y-2">
        {challenge.hints.map((hint, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/20">
              <span className="font-mono text-[9px] text-amber-400">
                {hint.order}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-300">{hint.text}</p>
              <p className="font-mono text-[10px] text-slate-600 mt-0.5">
                {hint.cost} pts
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => removeHint(i)}
              disabled={isRemoving}
              className="h-auto w-auto p-0 text-slate-600 hover:text-red-400 hover:bg-transparent transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {challenge.hints.length === 0 && !showForm && (
          <p className="text-xs text-slate-600 text-center py-3">
            No hints yet.
          </p>
        )}
      </div>

      {/* Add hint form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit(onAdd)}
            className="space-y-2 overflow-hidden border border-slate-800 rounded-lg p-3 bg-slate-900/40"
          >
            <Textarea
              {...register("text")}
              rows={2}
              placeholder="Hint text..."
              className="w-full rounded-md border-slate-700 bg-slate-900/60 px-2 py-1.5 text-xs text-white placeholder:text-slate-600 outline-none resize-none focus-visible:ring-0 focus:border-emerald-500/50"
            />
            {errors.text && (
              <p className="text-[10px] text-red-400">{errors.text.message}</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  {...register("cost")}
                  type="number"
                  placeholder="Cost (pts)"
                  className="w-full rounded-md border-slate-700 bg-slate-900/60 px-2 py-1.5 text-xs text-white placeholder:text-slate-600 outline-none focus-visible:ring-0 focus:border-emerald-500/50 h-auto"
                />
              </div>
              <div>
                <Input
                  {...register("order")}
                  type="number"
                  placeholder="Order (1, 2, 3...)"
                  className="w-full rounded-md border-slate-700 bg-slate-900/60 px-2 py-1.5 text-xs text-white placeholder:text-slate-600 outline-none focus-visible:ring-0 focus:border-emerald-500/50 h-auto"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="h-auto flex-1 rounded-md border-slate-700 bg-transparent py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-transparent transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isAdding}
                className="h-auto flex-1 flex items-center justify-center gap-1 rounded-md bg-emerald-500 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
              >
                {isAdding && <Loader2 className="h-3 w-3 animate-spin" />}
                Add hint
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}