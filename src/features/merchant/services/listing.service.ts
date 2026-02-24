import { dispatchIntegration } from "@/features/integrations/dispatcher";
import { prisma } from "@/lib/prisma";
import { ListingStatus } from "@prisma/client";

/*
|--------------------------------------------------------------------------
| LISTING STATUS TRANSITION GUARD
|--------------------------------------------------------------------------
*/

function canTransition(from: ListingStatus, to: ListingStatus) {
  const allowed: Record<ListingStatus, ListingStatus[]> = {
    LISTED: ["DELISTED", "SUSPENDED"],
    DELISTED: ["LISTED"],
    SUSPENDED: ["LISTED", "DELISTED"],
  };

  return allowed[from]?.includes(to);
}

/*
|--------------------------------------------------------------------------
| CREATE LISTING
|--------------------------------------------------------------------------
*/

export async function createListing(data: {
  productId: string;
  channelId: string;
  marketplaceSku: string;
  currentPrice: number;
}) {
  const channel = await prisma.channel.findUnique({
    where: { id: data.channelId },
  });

  if (!channel) {
    throw new Error("CHANNEL_NOT_FOUND");
  }

  if (!channel.isEnabled) {
    throw new Error("CHANNEL_DISABLED");
  }

  if (!channel.baseUrl || !channel.apiKey) {
    throw new Error("CHANNEL_NOT_CONFIGURED");
  }

  await dispatchIntegration(channel.id, "LIST_PRODUCT", {
    productId: data.productId,
    marketplaceSku: data.marketplaceSku,
    price: data.currentPrice,
  });
  const existing = await prisma.channelListing.findUnique({
    where: {
      productId_channelId: {
        productId: data.productId,
        channelId: data.channelId,
      },
    },
  });

  if (existing) {
    throw new Error("ALREADY_LISTED");
  }

  // Future: outbound integration hook here

  return prisma.channelListing.create({
    data: {
      productId: data.productId,
      channelId: data.channelId,
      marketplaceSku: data.marketplaceSku,
      currentPrice: data.currentPrice,
      listingStatus: ListingStatus.LISTED,
    },
  });
}

/*
|--------------------------------------------------------------------------
| UPDATE LISTING STATUS (WITH GUARD + HISTORY)
|--------------------------------------------------------------------------
*/

export async function updateListingStatus(
  listingId: string,
  newStatus: ListingStatus,
  reason?: string,
) {
  return prisma.$transaction(async (tx) => {
    const listing = await tx.channelListing.findUnique({
      where: { id: listingId },
      include: { channel: true },
    });

    if (!listing) {
      throw new Error("LISTING_NOT_FOUND");
    }

    if (!listing.channel.isEnabled) {
      throw new Error("CHANNEL_DISABLED");
    }

    if (!canTransition(listing.listingStatus, newStatus)) {
      throw new Error("INVALID_LISTING_TRANSITION");
    }

    // Future: outbound integration call here

    await tx.channelListingHistory.create({
      data: {
        channelListingId: listingId,
        previousStatus: listing.listingStatus,
        newStatus,
        reason,
      },
    });

    return tx.channelListing.update({
      where: { id: listingId },
      data: { listingStatus: newStatus },
    });
  });
}

/*
|--------------------------------------------------------------------------
| UPDATE LISTING PRICE
|--------------------------------------------------------------------------
*/

export async function updateListingPrice(
  listingId: string,
  data: {
    currentPrice?: number;
    discountAmount?: number | null;
    markupAmount?: number | null;
    followsBasePrice?: boolean;
  },
) {
  return prisma.channelListing.update({
    where: { id: listingId },
    data,
  });
}
