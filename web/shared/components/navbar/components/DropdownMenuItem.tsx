import Link from "next/link";
import { DropdownItem } from "../types/navbar.types";

export function DropdownMenuItem({
  item,
  onClose,
}: {
  item: DropdownItem;
  onClose: () => void;
}) {
  const Icon = item.icon;
  const inner = (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-300">{item.label}</p>
        {item.description && (
          <p className="truncate text-[11px] text-slate-600">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className="flex items-center rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.04]"
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      onClick={() => {
        item.onClick?.();
        onClose();
      }}
      className="flex w-full items-center rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.04]"
    >
      {inner}
    </button>
  );
}