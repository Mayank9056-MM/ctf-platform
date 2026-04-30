import { Story } from "@/modules/story/types/story.types";
import { Users } from "lucide-react";

 
export function CharactersPanel({ story }: { story: Story }) {
  if (!story.characters?.length) return null;
 
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0d1117]/90 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-4 w-4 text-slate-500" />
        <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
          Characters
        </span>
      </div>
      <div className="space-y-3">
        {story.characters.map((char) => (
          <div key={char.id} className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] overflow-hidden ring-1 ring-white/[0.08]">
              {char.avatarUrl ? (
                <img src={char.avatarUrl} alt={char.name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-mono text-[10px] font-bold text-slate-400">
                  {char.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs font-bold text-slate-300">{char.name}</p>
              {char.bio && (
                <p className="font-mono text-[10px] text-slate-600 mt-0.5 line-clamp-2">{char.bio}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}