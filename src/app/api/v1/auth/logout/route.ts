import { logoutByToken } from "@/lib/auth";
import { getBearerToken, requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await requireApiUser(request);
    const token = getBearerToken(request);
    if (!token) return ok({ error: "MISSING_AUTHORIZATION_TOKEN" }, 401);
    await logoutByToken(token);
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
