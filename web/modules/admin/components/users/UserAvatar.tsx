import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  AdminUser,
} from "@/modules/admin/types/admin.types";

/**
 * A component to display a user's avatar.
 * It can display an image from the user's avatar or a placeholder with the user's initials.
 * The size of the avatar can be specified using the `size` prop.
 * The sizes available are "sm", "md", and "lg".
 * The avatar will be displayed as a rounded image with a background color of `bg-slate-800`.
 * The avatar will also have a ring with a color of `ring-slate-700`.
 * The text inside the avatar will be displayed as a white monospace font with a font size of `text-base` for the "lg" size, `text-sm` for the "md" size, and `text-[10px]` for the "sm" size.
 * @param user - The user object to display the avatar for.
 * @param size - The size of the avatar. Defaults to "sm".
 * @returns A JSX element displaying the user's avatar.
 */
export function UserAvatar({
  user,
  size = "sm",
}: {
  user: AdminUser;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-14 w-14" : size === "md" ? "h-9 w-9" : "h-7 w-7";
  const text =
    size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-[10px]";
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg bg-slate-800 ring-1 ring-slate-700",
        dim,
      )}
    >
      {user.avatar?.url ? (
        <Image
          src={user.avatar.url}
          alt={user.username}
          fill
          className="object-cover"
          sizes="56px"
        />
      ) : (
        <span
          className={cn(
            "flex h-full w-full items-center justify-center font-mono font-semibold text-slate-300",
            text,
          )}
        >
          {user.username.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
