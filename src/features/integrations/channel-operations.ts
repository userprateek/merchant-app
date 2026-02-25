import { dispatchIntegration } from "@/features/integrations/dispatcher";
import { Prisma } from "@prisma/client";

export type ChannelOperation =
  | "LIST_PRODUCT"
  | "DELIST_PRODUCT"
  | "UPDATE_LISTING_PRICE"
  | "PULL_ORDERS"
  | "CONFIRM_ORDER"
  | "CANCEL_ORDER"
  | "PACK_ORDER"
  | "SHIP_ORDER"
  | "RETURN_ORDER"
  | "GENERATE_SHIPPING_LABEL"
  | "GENERATE_INVOICE"
  | "PULL_ORDER_UPDATES";

export async function runChannelOperation(
  channelId: string,
  operation: ChannelOperation,
  payload: Prisma.InputJsonValue
) {
  // Dummy adapter layer for future real channel API implementations.
  return dispatchIntegration(channelId, operation, payload);
}
