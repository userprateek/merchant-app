import { OrderStatus } from "@prisma/client";

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: [],
  CANCELLED: [],
  RETURNED: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus) {
  return ORDER_TRANSITIONS[from]?.includes(to);
}
