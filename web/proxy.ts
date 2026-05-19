import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route Classification

/**
 * Routes accessible without authentication.
 * Exact matches only — use startsWith for prefix matching below.
 */
const PUBLIC_EXACT: Set<string> = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
]);

/**
 * Public route prefixes (startsWith).
 */
const PUBLIC_PREFIXES: string[] = [
  "/auth/", // OAuth callbacks
  "/leaderboard", // Public scoreboard
  "/stories", // Public story listing
  "/events", // Public event listing
  "/_next/",
  "/api/", // All /api/* is proxied — auth enforced at backend
  "/images/",
  "/fonts/",
  "/favicon",
];

/**
 * Routes that should redirect AWAY if the user IS authenticated.
 * (prevents logged-in users from seeing the login page)
 */
const AUTH_ONLY_PATHS: Set<string> = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

/**
 * Admin-only route prefixes — requires role check.
 * Since we can't inspect JWT payload in middleware without the secret,
 * we rely on the backend to 403 and the client to handle it.
 * This is a UX guard only.
 */
const ADMIN_PREFIXES: string[] = ["/admin"];

// Cookie Names

// Your backend must set these cookie names
const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";

// Helpers

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthOnlyPath(pathname: string): boolean {
  return (
    AUTH_ONLY_PATHS.has(pathname) || pathname.startsWith("/reset-password")
  );
}

function hasValidSession(req: NextRequest): boolean {
  // We can't verify the JWT in middleware without importing jose/jsonwebtoken
  // (which adds significant cold-start latency). Instead we check for cookie
  // EXISTENCE only. The backend validates the token on every request.
  return (
    req.cookies.has(ACCESS_TOKEN_COOKIE) ||
    req.cookies.has(REFRESH_TOKEN_COOKIE)
  );
}

function buildLoginUrl(req: NextRequest, reason?: string): URL {
  const loginUrl = new URL("/login", req.url);
  const pathname = req.nextUrl.pathname;

  // Don't set `from` for root or dashboard — redundant redirect
  if (pathname !== "/" && pathname !== "/dashboard") {
    loginUrl.searchParams.set("from", pathname);
  }

  if (reason) loginUrl.searchParams.set("reason", reason);

  return loginUrl;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasSession = hasValidSession(req);

  // Auth-only pages redirect (logged-in users away from /login etc.)
  if (isAuthOnlyPath(pathname) && hasSession) {
    // Respect the `from` param if present, otherwise go to dashboard
    const from = req.nextUrl.searchParams.get("from");
    const destination =
      from && from.startsWith("/") && !isAuthOnlyPath(from)
        ? from
        : "/dashboard";

    return NextResponse.redirect(new URL(destination, req.url));
  }

  // Public paths pass through without auth
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Protected routes — require session
  if (!hasSession) {
    return NextResponse.redirect(buildLoginUrl(req));
  }

  // Admin routes — cookie exists but role check is backend's job
  // We set a header so the layout can read it, but we do NOT redirect here.
  // If the backend returns 403, the client handles it.
  const response = NextResponse.next();

  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    response.headers.set("X-Requires-Admin", "true");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static   (static files)
     * - _next/image    (image optimization)
     * - favicon.ico
     * - /images/, /fonts/  (public assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)",
  ],
};
