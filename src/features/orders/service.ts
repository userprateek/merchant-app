import { prisma } from "@/lib/prisma";
import { OrderStatus, InventoryMovementType } from "@prisma/client";

/*
|--------------------------------------------------------------------------
| STATE TRANSITION GUARD
|--------------------------------------------------------------------------
*/

function canTransition(from: OrderStatus, to: OrderStatus) {
  const allowed: Record<OrderStatus, OrderStatus[]> = {
    CREATED: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PACKED", "CANCELLED"],
    PACKED: ["SHIPPED"],
    SHIPPED: ["DELIVERED", "RETURNED"],
    DELIVERED: [],
    CANCELLED: [],
    RETURNED: [],
  };

  return allowed[from]?.includes(to);
}

/*
|--------------------------------------------------------------------------
| CONFIRM ORDER
|--------------------------------------------------------------------------
*/

export async function confirmOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new Error("ORDER_NOT_FOUND");

    if (!canTransition(order.status, "CONFIRMED"))
      throw new Error("INVALID_ORDER_STATE");

    for (const item of order.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) throw new Error("PRODUCT_NOT_FOUND");

      const available = product.totalStock - product.reservedStock;

      if (product.oversellPolicy === "REJECT") {
        if (available < item.quantity) throw new Error("OUT_OF_STOCK");
      }

      if (product.oversellPolicy === "LIMITED") {
        if (available - item.quantity < -(product.oversellLimit ?? 0))
          throw new Error("OVERSALE_LIMIT_EXCEEDED");
      }

      // Reserve stock
      await tx.product.update({
        where: { id: product.id },
        data: {
          reservedStock: {
            increment: item.quantity,
          },
        },
      });

      // Log movement
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          type: InventoryMovementType.CONFIRM,
          quantity: item.quantity,
          reference: orderId,
        },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "CONFIRMED" },
    });

    return { success: true };
  });
}

/*
|--------------------------------------------------------------------------
| CANCEL ORDER
|--------------------------------------------------------------------------
*/

export async function cancelOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new Error("ORDER_NOT_FOUND");

    if (!canTransition(order.status, "CANCELLED"))
      throw new Error("INVALID_ORDER_STATE");

    if (order.status === "CONFIRMED" || order.status === "PACKED") {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            reservedStock: {
              decrement: item.quantity,
            },
          },
        });

        // Log movement
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: InventoryMovementType.CANCEL,
            quantity: -item.quantity,
            reference: orderId,
          },
        });
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    return { success: true };
  });
}

/*
|--------------------------------------------------------------------------
| SHIP ORDER
|--------------------------------------------------------------------------
*/

export async function shipOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new Error("ORDER_NOT_FOUND");

    if (!canTransition(order.status, "SHIPPED"))
      throw new Error("INVALID_ORDER_STATE");

    await tx.order.update({
      where: { id: orderId },
      data: { status: "SHIPPED" },
    });

    return { success: true };
  });
}

/*
|--------------------------------------------------------------------------
| RETURN ORDER
|--------------------------------------------------------------------------
*/

export async function returnOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new Error("ORDER_NOT_FOUND");

    if (!canTransition(order.status, "RETURNED"))
      throw new Error("INVALID_ORDER_STATE");

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          reservedStock: {
            decrement: item.quantity,
          },
          totalStock: {
            increment: item.quantity,
          },
        },
      });

      // Log movement
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: InventoryMovementType.RETURN,
          quantity: item.quantity,
          reference: orderId,
        },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "RETURNED" },
    });

    return { success: true };
  });
}

/*
|--------------------------------------------------------------------------
| BULK OPERATIONS (PARTIAL SAFE)
|--------------------------------------------------------------------------
*/

async function processBulk(
  orderIds: string[],
  handler: (id: string) => Promise<any>
) {
  const results = {
    success: [] as string[],
    failed: [] as { id: string; reason: string }[],
  };

  for (const id of orderIds) {
    try {
      await handler(id);
      results.success.push(id);
    } catch (error: any) {
      results.failed.push({
        id,
        reason: error.message || "UNKNOWN_ERROR",
      });
    }
  }

  return results;
}

export function bulkConfirmOrders(orderIds: string[]) {
  return processBulk(orderIds, confirmOrder);
}

export function bulkShipOrders(orderIds: string[]) {
  return processBulk(orderIds, shipOrder);
}

export function bulkCancelOrders(orderIds: string[]) {
  return processBulk(orderIds, cancelOrder);
}