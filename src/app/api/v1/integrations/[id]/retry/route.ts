import { retryIntegrationLog } from "@/features/integrations/service";
import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const { id } = await context.params;
    const result = await retryIntegrationLog(id);
    return ok({ success: true, result });
  } catch (error) {
    return handleApiError(error);
  }
}
