import { getChannels } from "@/features/channels/service";
import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const channels = await getChannels();
    return ok({ channels });
  } catch (error) {
    return handleApiError(error);
  }
}
