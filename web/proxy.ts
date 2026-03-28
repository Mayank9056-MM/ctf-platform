import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/auth/github/callback",
];

const AUTH_ONLY_PATHS = ["/login", "/register", "/forgot-password"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Api Forwarding
  if (pathname.startsWith("/api")) {
    const backendUrl = new URL(pathname, "http://localhost:5000");

    return NextResponse.rewrite(backendUrl);
  }

  // Check for session cookie (httpOnly — we can't read the value, just existence)
  const hasSession =
    req.cookies.has("accessToken") || req.cookies.has("refreshToken");

  // Redirect authenticated users away from auth pages
  if (AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p)) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users to login
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith("/auth/"),
  );

  if (!isPublic && !hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|fonts).*)"],
};
