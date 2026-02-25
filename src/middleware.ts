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

function readCookieFromHeader(request: NextRequest, name: string) {
  const direct = request.cookies.get(name)?.value;
  if (direct) return direct;

  const rawCookie = request.headers.get("cookie");
  if (!rawCookie) return undefined;

  const token = rawCookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!token) return undefined;
  const value = token.slice(name.length + 1);
  return value ? decodeURIComponent(value) : undefined;
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

  const sessionToken = readCookieFromHeader(request, SESSION_COOKIE);
  const role = readCookieFromHeader(request, ROLE_COOKIE);

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
