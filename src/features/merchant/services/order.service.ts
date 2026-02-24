import { prisma } from "@/lib/prisma";

export async function createOrder(data: {
  channelId: string;
  externalOrderId: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  discountAmount?: number;
  offerCode?: string;
}) {
  const totalAmount = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  return prisma.order.create({
    data: {
      channelId: data.channelId,
      externalOrderId: data.externalOrderId,
      totalAmount,
      discountAmount: data.discountAmount,
      offerCode: data.offerCode,
      status: "CREATED",
      createdAt: new Date(),
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
      },
    },
  });
}