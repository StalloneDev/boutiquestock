import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  // 1. Skip middleware for static assets, public files, and login page
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname === "/login" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Redirect to login if no session
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // 3. Verify session
    await decrypt(session);
    return NextResponse.next();
  } catch (error) {
    // 4. If session is invalid, redirect to login
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("session");
    return res;
  }
}

// Optional: Limit middleware to specific paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
