import { cn } from "@/lib/utils";
import { ComponentProps } from "react";

type SkeletonProps = ComponentProps<"div">;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded bg-slate-800/60", className)}
      {...props}
    />
  );
}
