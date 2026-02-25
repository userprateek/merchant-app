import { updateListingPrice, updateListingStatus } from "@/features/merchant/services/listing.service";
import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { ListingStatus, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const { id } = await context.params;
    const body = (await request.json()) as {
      currentPrice?: number;
      discountAmount?: number | null;
      markupAmount?: number | null;
      followsBasePrice?: boolean;
      status?: ListingStatus;
      reason?: string;
    };

    if (body.status && body.status in ListingStatus) {
      await updateListingStatus(id, body.status, body.reason || "API_STATUS_UPDATE");
    }

    if (
      body.currentPrice !== undefined ||
      body.discountAmount !== undefined ||
      body.markupAmount !== undefined ||
      body.followsBasePrice !== undefined
    ) {
      await updateListingPrice(id, {
        currentPrice:
          body.currentPrice !== undefined ? Number(body.currentPrice) : undefined,
        discountAmount: body.discountAmount,
        markupAmount: body.markupAmount,
        followsBasePrice: body.followsBasePrice,
      });
    }

    const listing = await prisma.channelListing.findUnique({ where: { id } });
    if (!listing) return ok({ error: "LISTING_NOT_FOUND" }, 404);
    return ok({ listing });
  } catch (error) {
    return handleApiError(error);
  }
}
