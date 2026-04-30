export function CharacterAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-8 w-8 overflow-hidden rounded-xl bg-white/[0.08] ring-1 ring-white/[0.1] shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-mono text-[10px] font-bold text-slate-400">
            {name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <span className="font-mono text-[11px] font-bold text-slate-400">
        {name}
      </span>
    </div>
  );
}
