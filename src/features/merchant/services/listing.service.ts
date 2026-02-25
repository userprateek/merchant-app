import { runChannelOperation } from "@/features/integrations/channel-operations";
import { prisma } from "@/lib/prisma";
import { ListingStatus, Prisma } from "@prisma/client";
import { canTransitionListing } from "@/features/merchant/services/listing-transitions";

/*
|--------------------------------------------------------------------------
| LISTING STATUS TRANSITION GUARD
|--------------------------------------------------------------------------
*/

export function canTransition(from: ListingStatus, to: ListingStatus) {
  return canTransitionListing(from, to);
}

async function assertProductIsListable(
  db: Prisma.TransactionClient | typeof prisma,
  productId: string
) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      images: true,
    },
  });

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  const missing: string[] = [];
  if (!product.description?.trim()) missing.push("description");
  if (!product.metaTitle?.trim()) missing.push("metaTitle");
  if (!product.metaDescription?.trim()) missing.push("metaDescription");
  if (product.images.length === 0) missing.push("images");

  if (missing.length > 0) {
    throw new Error(`PRODUCT_CONTENT_INCOMPLETE:${missing.join(",")}`);
  }
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
  await assertProductIsListable(prisma, data.productId);

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

  await runChannelOperation(channel.id, "LIST_PRODUCT", {
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

    if (newStatus === "LISTED") {
      await assertProductIsListable(tx, listing.productId);
    }

    if (newStatus === "DELISTED") {
      await runChannelOperation(listing.channelId, "DELIST_PRODUCT", {
        listingId: listing.id,
        productId: listing.productId,
      });
    }
    if (newStatus === "LISTED") {
      await runChannelOperation(listing.channelId, "LIST_PRODUCT", {
        listingId: listing.id,
        productId: listing.productId,
      });
    }

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
  const updatedListing = await prisma.channelListing.update({
    where: { id: listingId },
    data,
  });

  await runChannelOperation(updatedListing.channelId, "UPDATE_LISTING_PRICE", {
    listingId: updatedListing.id,
    productId: updatedListing.productId,
    currentPrice: updatedListing.currentPrice,
    discountAmount: updatedListing.discountAmount,
    markupAmount: updatedListing.markupAmount,
  });

  return updatedListing;
}
