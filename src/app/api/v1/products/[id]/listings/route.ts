import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import {
  createListing,
  updateListingPrice,
  updateListingStatus,
} from "@/features/merchant/services/listing.service";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const { id } = await context.params;
    const listings = await prisma.channelListing.findMany({
      where: { productId: id },
      include: { channel: true },
      orderBy: { createdAt: "desc" },
    });
    return ok({ listings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const { id: productId } = await context.params;
    const body = (await request.json()) as {
      channelId?: string;
      marketplaceSku?: string;
      currentPrice?: number;
      discountAmount?: number;
      markupAmount?: number;
      listingStatus?: "LISTED" | "DELISTED" | "SUSPENDED";
    };

    const channelId = body.channelId?.trim() ?? "";
    const currentPrice = Number(body.currentPrice);
    if (!channelId || !Number.isFinite(currentPrice)) {
      return ok({ error: "INVALID_INPUT" }, 400);
    }

    const existing = await prisma.channelListing.findUnique({
      where: {
        productId_channelId: { productId, channelId },
      },
    });

    if (!existing) {
      const created = await createListing({
        productId,
        channelId,
        marketplaceSku: body.marketplaceSku?.trim() || `${productId}-${channelId}`,
        currentPrice,
      });
      await updateListingPrice(created.id, {
        discountAmount: body.discountAmount ?? null,
        markupAmount: body.markupAmount ?? null,
      });
      return ok({ listing: created }, 201);
    }

    await updateListingPrice(existing.id, {
      currentPrice,
      discountAmount: body.discountAmount ?? existing.discountAmount,
      markupAmount: body.markupAmount ?? existing.markupAmount,
    });

    if (body.listingStatus && body.listingStatus !== existing.listingStatus) {
      await updateListingStatus(existing.id, body.listingStatus, "API_STATUS_UPDATE");
    }

    const listing = await prisma.channelListing.findUnique({ where: { id: existing.id } });
    return ok({ listing });
  } catch (error) {
    return handleApiError(error);
  }
}
