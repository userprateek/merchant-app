import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type IntegrationEvent =
  | "LIST_PRODUCT"
  | "DELIST_PRODUCT"
  | "CONFIRM_ORDER"
  | "SHIP_ORDER"
  | "CANCEL_ORDER"
  | "PULL_ORDERS";

export async function dispatchIntegration(
  channelId: string,
  event: IntegrationEvent,
  payload: Prisma.InputJsonValue
) {
  try {
    // Placeholder for real API call
    const simulatedResponse = {
      message: "Simulated call",
      event,
    };

    await prisma.integrationLog.create({
      data: {
        channelId,
        eventType: event,
        payload,
        response: simulatedResponse,
        status: "SUCCESS",
      },
    });

    return simulatedResponse;
  } catch (error: unknown) {
    await prisma.integrationLog.create({
      data: {
        channelId,
        eventType: event,
        payload,
        response: {
          error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
        },
        status: "FAILED",
      },
    });

    throw error;
  }
}
