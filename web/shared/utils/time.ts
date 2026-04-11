export function timeAgo(date?: Date | string | null): string {
  if (!date) return "—";

  const d = typeof date === "string" ? new Date(date) : date;

  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return "—";
  }

  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;

  return d.toLocaleDateString();
}