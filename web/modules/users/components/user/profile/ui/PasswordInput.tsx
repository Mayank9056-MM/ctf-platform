import { cn } from "@/lib/utils";
import { inputCn } from "./inputCn";

export function PasswordInput({
  name,
  register,
  show,
  onToggle,
}: {
  name: string;
  register;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        {...register(name)}
        type={show ? "text" : "password"}
        placeholder="••••••••"
        className={cn(inputCn(false), "pr-10")}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-600 hover:text-slate-300 transition-colors"
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}
