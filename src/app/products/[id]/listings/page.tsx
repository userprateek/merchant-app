import ChannelListingManager from "@/features/merchant/components/ChannelListingManager";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  createListing,
  updateListingPrice,
  updateListingStatus,
} from "@/features/merchant/services/listing.service";
import { getRequiredNumber, getRequiredString } from "@/lib/validation";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export default async function ProductListingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole([UserRole.ADMIN, UserRole.MANAGER]);

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      listings: true,
    },
  });

  if (!product) {
    return <div>Product not found</div>;
  }

  const channels = await prisma.channel.findMany({
    orderBy: { name: "asc" },
  });
  const productForClient = {
    id: product.id,
    name: product.name,
    sku: product.sku,
    basePrice: product.basePrice,
    listings: product.listings.map((listing) => ({
      id: listing.id,
      channelId: listing.channelId,
      listingStatus: listing.listingStatus,
      discountAmount: listing.discountAmount,
      markupAmount: listing.markupAmount,
    })),
  };
  const channelsForClient = channels.map((channel) => ({
    id: channel.id,
    name: channel.name,
    isEnabled: channel.isEnabled,
  }));

  // -------------------------
  // SERVER ACTIONS
  // -------------------------

  async function saveListingAction(formData: FormData) {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);

    const productId = getRequiredString(formData, "productId");
    const channelId = getRequiredString(formData, "channelId");

    const discount = getRequiredNumber(formData, "discount");
    const markup = getRequiredNumber(formData, "markup");

    const existing = await prisma.channelListing.findUnique({
      where: {
        productId_channelId: {
          productId,
          channelId,
        },
      },
      include: { product: true },
    });

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) return;

    const finalPrice =
      product.basePrice - discount + markup;

    if (existing) {
      await updateListingPrice(existing.id, {
        discountAmount: discount,
        markupAmount: markup,
        currentPrice: finalPrice,
        followsBasePrice: false,
      });

      if (existing.listingStatus !== "LISTED") {
        await updateListingStatus(existing.id, "LISTED", "MANUAL_RELIST");
      }
    } else {
      const listing = await createListing({
        productId,
        channelId,
        marketplaceSku: `${product.sku}-${channelId}`,
        currentPrice: finalPrice,
      });

      await updateListingPrice(listing.id, {
        discountAmount: discount,
        markupAmount: markup,
        followsBasePrice: false,
      });
    }

    revalidatePath(`/products/${productId}/listings`);
  }

  async function delistAction(formData: FormData) {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);

    const listingId = getRequiredString(formData, "listingId");
    const productId = getRequiredString(formData, "productId");

    await updateListingStatus(listingId, "DELISTED", "MANUAL_DELIST");

    revalidatePath(`/products/${productId}/listings`);
  }

  return (
    <div className="app-shell">
      <div className="page-header">
        <h1 className="page-title">
          Manage Listings — {product.name} ({product.sku})
        </h1>
      </div>

      <section className="section-card">
        <ChannelListingManager
          product={productForClient}
          channels={channelsForClient}
          saveListingAction={saveListingAction}
          delistAction={delistAction}
        />
      </section>
    </div>
  );
}
