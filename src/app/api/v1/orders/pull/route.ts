import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { pullOrdersForAllEnabledChannels } from "@/features/orders/pull.service";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const result = await pullOrdersForAllEnabledChannels();
    return ok({ result });
  } catch (error) {
    return handleApiError(error);
  }
}
