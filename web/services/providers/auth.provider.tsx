"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useCurrentUser } from "@/modules/users/hooks/useCurrentUser";

// Toast messages for redirect reasons

const REDIRECT_REASON_MESSAGES: Record<string, string> = {
  session_expired: "Your session expired. Please sign in again.",
  unauthorized: "You need to sign in to access that page.",
  banned: "Your account has been suspended.",
  deleted: "This account no longer exists.",
  token_invalid: "Invalid session token. Please sign in again.",
};

// Session hydrator

function SessionHydrator({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const { isLoading, isError } = useCurrentUser();

  const setHydrated = useAuthStore((s) => s.setHydrated);
  const logout = useAuthStore((s) => s.logout);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // Show toast for redirect reason
  useEffect(() => {
    const reason = searchParams.get("reason");
    if (!reason) return;

    const message = REDIRECT_REASON_MESSAGES[reason];
    if (message) {
      // Small delay so the toast appears after the page loads
      const t = setTimeout(
        () => toast.error(message, { id: "auth-redirect" }),
        400,
      );
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  // Show success message after registration
  useEffect(() => {
    const registered = searchParams.get("registered");
    if (registered === "true") {
      const t = setTimeout(
        () =>
          toast.success("Account created! Check your email to verify.", {
            id: "just-registered",
            duration: 6000,
          }),
        400,
      );
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  // Verify session on mount
  // Calls /auth/me to validate the httpOnly cookie session.
  // This is the single source of truth for whether the user is logged in.
  useEffect(() => {
    if (isLoading) return;

    if (isError) {
      logout();
    }

    setHydrated();
  }, [isLoading, isError]);

  // Prevent flash of authenticated content
  // While we're verifying the session, show a loading state.
  // This prevents the brief flash where a protected page renders before
  // the /auth/me call confirms the user isn't logged in.
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-emerald-500/50 animate-bounce"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
          <p className="font-mono text-xs text-slate-600">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Root Auth Provider

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  if (!googleClientId) {
    console.warn("[AuthProvider] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set.");
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <SessionHydrator>{children}</SessionHydrator>
    </GoogleOAuthProvider>
  );
}
