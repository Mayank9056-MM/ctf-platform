export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">
          {label}
        </label>
        {hint && (
          <span className="font-mono text-[9px] text-slate-800">{hint}</span>
        )}
      </div>
      {children}
      {error && (
        <p className="mt-1 font-mono text-[10px] text-red-400">{error}</p>
      )}
    </div>
  );
}
