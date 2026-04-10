export function SkeletonRow() {
  return (
    <tr className="border-b border-slate-800/50">
      {[40, 160, 140, 80, 70, 80, 90, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="animate-pulse rounded bg-slate-800/60"
            style={{ height: 14, width: w }}
          />
        </td>
      ))}
    </tr>
  );
}
