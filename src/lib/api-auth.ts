import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { getUserByAccessToken } from "@/lib/auth";

export class ApiAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export function getBearerToken(request: NextRequest) {
  const value = request.headers.get("authorization") ?? "";
  if (!value.startsWith("Bearer ")) return null;
  const token = value.slice("Bearer ".length).trim();
  return token || null;
}

export async function requireApiUser(
  request: NextRequest,
  allowedRoles?: UserRole[]
) {
  const token = getBearerToken(request);
  if (!token) {
    throw new ApiAuthError("MISSING_AUTHORIZATION_TOKEN", 401);
  }

  const user = await getUserByAccessToken(token);
  if (!user) {
    throw new ApiAuthError("INVALID_OR_EXPIRED_TOKEN", 401);
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new ApiAuthError("FORBIDDEN", 403);
  }

  return { user, token };
}
