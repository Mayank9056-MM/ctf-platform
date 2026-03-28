import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { AuthStore, AuthUser } from "../types/auth.types";

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        // State
        user: null,
        isAuthenticated: false,
        isLoading: true,
        isHydrated: false,

        // Actions
        setUser: (user: AuthUser | null) =>
          set(
            {
              user,
              isAuthenticated: !!user,
              isLoading: false,
            },
            false,
            "setUser",
          ),

        setLoading: (loading: boolean) =>
          set({ isLoading: loading }, false, "setLoading"),

        setHydrated: () =>
          set({ isHydrated: true, isLoading: false }, false, "setHydrated"),

        logout: () =>
          set(
            {
              user: null,
              isAuthenticated: false,
              isLoading: false,
            },
            false,
            "logout",
          ),
      }),
      {
        name: "ctf-auth",
        // Only persist the user — never persist tokens (they live in httpOnly cookies)
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          state?.setHydrated();
        },
      },
    ),
    { name: "AuthStore" },
  ),
);

// Selectors (prevents unnecessary re-renders)

export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useIsAdmin = () =>
  useAuthStore((s) =>
    s.user ? ["admin", "superadmin"].includes(s.user.role) : false,
  );
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useIsHydrated = () => useAuthStore((s) => s.isHydrated);
