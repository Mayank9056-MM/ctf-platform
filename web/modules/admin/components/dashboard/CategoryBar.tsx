import { motion } from "motion/react";
import { fmt } from "../../helpers/helpers";

/**
 * A bar component that shows a category's label, count, and solves.
 * The bar's width is proportional to the count relative to the max count.
 * The bar has a subtle animation when it appears.
 *
 * @param {{string}} label - The label of the category.
 * @param {{number}} count - The count of the category.
 * @param {{number}} solves - The number of solves in the category.
 * @param {{number}} max - The maximum count of all categories.
 * @param {{number}} delay - The delay of the animation in milliseconds.
 */
export function CategoryBar({
  label,
  count,
  solves,
  max,
  delay,
}: {
  label: string;
  count: number;
  solves: number;
  max: number;
  delay: number;
}) {
  const width = max ? (count / max) * 100 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-slate-300 uppercase tracking-wider text-[11px]">
          {label}
        </span>
        <div className="flex gap-3 text-slate-500">
          <span>{count} challs</span>
          <span className="text-emerald-400">{fmt(solves)} solves</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.6, delay: delay + 0.1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
