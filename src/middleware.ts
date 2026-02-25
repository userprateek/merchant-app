import { NextRequest, NextResponse } from "next/server";
import { ROLE_COOKIE, SESSION_COOKIE } from "@/lib/auth-constants";

const PUBLIC_PATHS = new Set(["/login", "/signup", "/unauthorized"]);

const ROLE_RULES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/products", roles: ["ADMIN", "MANAGER"] },
  { prefix: "/channels", roles: ["ADMIN", "MANAGER"] },
  { prefix: "/integrations", roles: ["ADMIN", "MANAGER"] },
  { prefix: "/orders", roles: ["ADMIN", "MANAGER", "PACKING_CREW"] },
  { prefix: "/dashboard", roles: ["ADMIN", "MANAGER", "PACKING_CREW", "VIEWER"] },
];

function isProtectedPath(pathname: string) {
  if (pathname === "/") return true;
  return ROLE_RULES.some((rule) => pathname.startsWith(rule.prefix));
}

function allowedForPath(pathname: string, role: string) {
  const rule = ROLE_RULES.find((entry) => pathname.startsWith(entry.prefix));
  if (!rule) return true;
  return rule.roles.includes(role);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const role = request.cookies.get(ROLE_COOKIE)?.value;

  if (PUBLIC_PATHS.has(pathname) && sessionToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isProtectedPath(pathname) && !sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isProtectedPath(pathname) && role && !allowedForPath(pathname, role)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
