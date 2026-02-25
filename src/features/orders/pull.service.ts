import { dispatchIntegration } from "@/features/integrations/dispatcher";
import { prisma } from "@/lib/prisma";

type PullResult = {
  created: number;
  skipped: number;
};

function simulatedExternalIds(channelName: string) {
  const day = new Date().toISOString().slice(0, 10);
  return [`PULL-${channelName}-${day}-A`, `PULL-${channelName}-${day}-B`];
}

export async function pullOrdersForChannel(channelId: string): Promise<PullResult> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
  });

  if (!channel) throw new Error("CHANNEL_NOT_FOUND");
  if (!channel.isEnabled) throw new Error("CHANNEL_DISABLED");

  await dispatchIntegration(channel.id, "PULL_ORDERS", {
    channelId: channel.id,
    triggeredAt: new Date().toISOString(),
  });

  const product = await prisma.product.findFirst({
    where: {
      status: "ACTIVE",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!product) {
    throw new Error("NO_ACTIVE_PRODUCT_FOR_PULL");
  }

  let created = 0;
  let skipped = 0;

  for (const externalOrderId of simulatedExternalIds(channel.name)) {
    const existing = await prisma.order.findUnique({
      where: {
        channelId_externalOrderId: {
          channelId: channel.id,
          externalOrderId,
        },
      },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.order.create({
      data: {
        channelId: channel.id,
        externalOrderId,
        totalAmount: product.basePrice,
        status: "CREATED",
        items: {
          create: [
            {
              productId: product.id,
              quantity: 1,
              unitPrice: product.basePrice,
              totalPrice: product.basePrice,
            },
          ],
        },
      },
    });

    created += 1;
  }

  return { created, skipped };
}

export async function pullOrdersForAllEnabledChannels() {
  const channels = await prisma.channel.findMany({
    where: { isEnabled: true },
    orderBy: { name: "asc" },
  });

  const results = [];
  for (const channel of channels) {
    try {
      const result = await pullOrdersForChannel(channel.id);
      results.push({ channelId: channel.id, ...result });
    } catch (error) {
      results.push({
        channelId: channel.id,
        created: 0,
        skipped: 0,
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      });
    }
  }

  return results;
}
