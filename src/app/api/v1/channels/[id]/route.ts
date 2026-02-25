import { updateChannelConfig } from "@/features/channels/service";
import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/secrets";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const { id } = await context.params;
    const channel = await prisma.channel.findUnique({ where: { id } });
    if (!channel) return ok({ error: "CHANNEL_NOT_FOUND" }, 404);
    return ok({ channel });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const { id } = await context.params;
    const body = (await request.json()) as {
      baseUrl?: string | null;
      apiKey?: string | null;
      apiSecret?: string | null;
      accessToken?: string | null;
      webhookSecret?: string | null;
      isEnabled?: boolean;
      isSandbox?: boolean;
    };

    const updated = await updateChannelConfig(id, {
      baseUrl: body.baseUrl ?? undefined,
      apiKey: body.apiKey === undefined ? undefined : encryptSecret(body.apiKey ?? undefined),
      apiSecret:
        body.apiSecret === undefined ? undefined : encryptSecret(body.apiSecret ?? undefined),
      accessToken:
        body.accessToken === undefined ? undefined : encryptSecret(body.accessToken ?? undefined),
      webhookSecret:
        body.webhookSecret === undefined
          ? undefined
          : encryptSecret(body.webhookSecret ?? undefined),
      isEnabled: body.isEnabled,
      isSandbox: body.isSandbox,
    });
    return ok({ channel: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
