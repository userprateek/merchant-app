import ChannelListingManager from "@/features/merchant/components/ChannelListingManager";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function ProductListingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  // -------------------------
  // SERVER ACTIONS
  // -------------------------

  async function saveListingAction(formData: FormData) {
    "use server";

    const productId = formData.get("productId") as string;
    const channelId = formData.get("channelId") as string;

    const discount = Number(formData.get("discount") || 0);
    const markup = Number(formData.get("markup") || 0);

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
      // UPDATE
      await prisma.channelListing.update({
        where: { id: existing.id },
        data: {
          discountAmount: discount,
          markupAmount: markup,
          currentPrice: finalPrice,
          listingStatus: "LISTED",
        },
      });
    } else {
      // CREATE
      await prisma.channelListing.create({
        data: {
          productId,
          channelId,
          marketplaceSku: `${product.sku}-${channelId}`,
          currentPrice: finalPrice,
          discountAmount: discount,
          markupAmount: markup,
          followsBasePrice: false,
          listingStatus: "LISTED",
        },
      });
    }

    revalidatePath(`/products/${productId}/listings`);
  }

  async function delistAction(formData: FormData) {
    "use server";

    const listingId = formData.get("listingId") as string;
    const productId = formData.get("productId") as string;

    await prisma.channelListing.update({
      where: { id: listingId },
      data: {
        listingStatus: "DELISTED",
      },
    });

    revalidatePath(`/products/${productId}/listings`);
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>
        Manage Listings — {product.name} ({product.sku})
      </h2>

      <ChannelListingManager
        product={product}
        channels={channels}
        saveListingAction={saveListingAction}
        delistAction={delistAction}
      />
    </div>
  );
}