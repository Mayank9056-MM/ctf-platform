import { User, X } from "lucide-react";

export function CharacterCard({
  character,
  storyId,
  onRemove,
}: {
  character: { id: string; name: string; avatarUrl?: string; bio?: string };
  storyId: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 group">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-800 ring-1 ring-slate-700">
        {character.avatarUrl ? (
          <img
            src={character.avatarUrl}
            alt={character.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="h-4 w-4 text-slate-500" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm text-white truncate">
            {character.name}
          </p>
          <span className="font-mono text-[9px] text-slate-600">
            @{character.id}
          </span>
        </div>
        {character.bio && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
            {character.bio}
          </p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
