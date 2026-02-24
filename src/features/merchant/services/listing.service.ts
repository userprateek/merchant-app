import { prisma } from "@/lib/prisma";

export async function createListing(data: {
  productId: string;
  channelId: string;
  marketplaceSku: string;
  currentPrice: number;
}) {
  return prisma.channelListing.create({
    data: {
      productId: data.productId,
      channelId: data.channelId,
      marketplaceSku: data.marketplaceSku,
      currentPrice: data.currentPrice,
      listingStatus: "LISTED",
    },
  });
}

export async function updateListingStatus(
  listingId: string,
  newStatus: string,
  reason?: string
) {
  const listing = await prisma.channelListing.findUnique({
    where: { id: listingId },
  });

  if (!listing) throw new Error("LISTING_NOT_FOUND");

  await prisma.channelListingHistory.create({
    data: {
      channelListingId: listingId,
      previousStatus: listing.listingStatus,
      newStatus,
      reason,
    },
  });

  return prisma.channelListing.update({
    where: { id: listingId },
    data: { listingStatus: newStatus },
  });
}