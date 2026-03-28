"use client";

import { useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import { config } from "@/config";

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const setLoading = useAuthStore((s) => s.setLoading);

  // This triggers the /auth/me call to verify the cookie session on load
  const { isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading) setLoading(false);
  }, [isLoading, setLoading]);

  if (!isHydrated) return null; // Prevent flash of unauthenticated content

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || config.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthHydrator>{children}</AuthHydrator>
    </GoogleOAuthProvider>
  );
}
