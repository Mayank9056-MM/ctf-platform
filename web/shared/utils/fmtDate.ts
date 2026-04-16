import { formatDistanceToNow } from "date-fns";

export function fmtRelative(value: string | Date | undefined | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : formatDistanceToNow(d, { addSuffix: true });
}
