import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { pollOrderUpdatesFromAllEnabledChannels } from "@/features/orders/channel-events.service";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const result = await pollOrderUpdatesFromAllEnabledChannels();
    return ok({ result });
  } catch (error) {
    return handleApiError(error);
  }
}
