"use client";

import { AuthenticatedNavbar } from "./components/AuthenticatedNavbar";
import { PublicNavbar } from "./components/PublicNavbar";
import { useNavbar } from "./hooks/useNavbar";

// Main export

/**
 * Unified Navbar — auto-switches between public and authenticated modes
 * based on the presence of `user` from `useNavbar()`.
 *
 * Prop overrides for layout-level control:
 *
 * @prop forceAuthenticated  — always render the full app navbar (use in the
 *                             authenticated layout where you know user exists)
 * @prop forcePublic         — always render the public navbar (use in marketing
 *                             pages, (auth) layout, etc.)
 *
 * When neither prop is set, the component reads `user` from the auth context
 * and renders the appropriate variant automatically — safe for the root layout.
 *
 * @example
 * // app/layout.tsx — root, auto-detects auth state
 * <Navbar />
 *
 * // app/(app)/layout.tsx — always authenticated
 * <Navbar forceAuthenticated />
 *
 * // app/(auth)/layout.tsx or landing — always public
 * <Navbar forcePublic />
 */
export function Navbar({
  forceAuthenticated = false,
  forcePublic = false,
}: {
  /** Skip auth check — always render full app navbar */
  forceAuthenticated?: boolean;
  /** Skip auth check — always render public navbar */
  forcePublic?: boolean;
}) {
  const { user, isScrolled } = useNavbar();

  const showAuthenticated =
    forceAuthenticated || (!forcePublic && user != null);

  return (
    <>
      {showAuthenticated ? (
        <AuthenticatedNavbar isScrolled={isScrolled} />
      ) : (
        <PublicNavbar isScrolled={isScrolled} />
      )}
      {/* Spacer so page content clears the fixed header */}
      <div className="h-14" />
    </>
  );
}
