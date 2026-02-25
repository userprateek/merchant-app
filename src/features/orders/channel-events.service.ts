import { runChannelOperation } from "@/features/integrations/channel-operations";
import { cancelOrder, returnOrder } from "@/features/orders/service";
import { prisma } from "@/lib/prisma";

export type ChannelOrderEventType =
  | "ORDER_CANCELLED_BY_CUSTOMER"
  | "ORDER_RETURNED_TO_WAREHOUSE";

export async function processChannelOrderCancelled(data: {
  channelId: string;
  externalOrderId: string;
  occurredAt?: string;
}) {
  const order = await prisma.order.findUnique({
    where: {
      channelId_externalOrderId: {
        channelId: data.channelId,
        externalOrderId: data.externalOrderId,
      },
    },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");

  const occurredAt = data.occurredAt ? new Date(data.occurredAt) : new Date();
  await prisma.order.update({
    where: { id: order.id },
    data: { customerCancelledAt: occurredAt },
  });

  // If not shipped yet, we can directly cancel operationally.
  if (order.status === "CREATED" || order.status === "CONFIRMED" || order.status === "PACKED") {
    await cancelOrder(order.id);
    return { orderId: order.id, status: "CANCELLED", awaitingWarehouse: false };
  }

  // If shipped, wait for warehouse receipt before marking returned.
  if (order.status === "SHIPPED") {
    return { orderId: order.id, status: "SHIPPED", awaitingWarehouse: true };
  }

  return { orderId: order.id, status: order.status, awaitingWarehouse: false };
}

export async function markOrderReturnedToWarehouse(data: {
  channelId: string;
  externalOrderId: string;
  occurredAt?: string;
}) {
  const order = await prisma.order.findUnique({
    where: {
      channelId_externalOrderId: {
        channelId: data.channelId,
        externalOrderId: data.externalOrderId,
      },
    },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");

  return markOrderReturnedToWarehouseById(order.id, data.occurredAt);
}

export async function markOrderReturnedToWarehouseById(orderId: string, occurredAt?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");

  if (order.status === "SHIPPED") {
    await returnOrder(order.id);
  }

  const receivedAt = occurredAt ? new Date(occurredAt) : new Date();
  await prisma.order.update({
    where: { id: order.id },
    data: { warehouseReceivedAt: receivedAt },
  });

  return { orderId: order.id, status: order.status === "SHIPPED" ? "RETURNED" : order.status };
}

export async function processChannelOrderEvent(data: {
  channelId: string;
  type: ChannelOrderEventType;
  externalOrderId: string;
  occurredAt?: string;
}) {
  if (data.type === "ORDER_CANCELLED_BY_CUSTOMER") {
    return processChannelOrderCancelled(data);
  }
  if (data.type === "ORDER_RETURNED_TO_WAREHOUSE") {
    return markOrderReturnedToWarehouse(data);
  }
  throw new Error("UNSUPPORTED_EVENT");
}

export async function pollOrderUpdatesFromAllEnabledChannels() {
  const channels = await prisma.channel.findMany({
    where: { isEnabled: true },
    orderBy: { name: "asc" },
  });

  const results: Array<{ channelId: string; pulled: number }> = [];
  for (const channel of channels) {
    await runChannelOperation(channel.id, "PULL_ORDER_UPDATES", {
      channelId: channel.id,
      triggeredAt: new Date().toISOString(),
    });
    // Placeholder: replace with parsed provider updates later.
    results.push({ channelId: channel.id, pulled: 0 });
  }

  return results;
}
