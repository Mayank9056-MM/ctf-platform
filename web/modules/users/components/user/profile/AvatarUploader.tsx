import { useAuthStore } from "@/modules/auth/store/auth.store";
import { UserProfile } from "@/modules/users/types/user.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { toast } from "sonner";

export function AvatarUploader({ user }: { user: UserProfile }) {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const fileRef = useRef<HTMLInputElement>(null);

  const { mutate: uploadAvatar, isPending } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/v1/user/update-avatar", {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data.data);
      qc.invalidateQueries({ queryKey: ["user", "current"] });
      toast.success("Avatar updated.");
    },
    onError: () => toast.error("Failed to upload avatar."),
  });

  return (
    <div className="relative group w-fit">
      <div className="relative h-24 w-24 overflow-hidden rounded-2xl ring-2 ring-white/[0.1] ring-offset-2 ring-offset-[#080c10]">
        {user.avatar?.url ? (
          <Image
            src={user.avatar.url}
            alt={user.username}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/[0.08]">
            <span className="font-mono text-2xl font-bold text-slate-300">
              {user.username.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadAvatar(f);
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500 ring-2 ring-[#080c10] hover:bg-emerald-400 transition-colors"
      >
        <Camera className="h-3.5 w-3.5 text-slate-950" />
      </button>
    </div>
  );
}
