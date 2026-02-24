import { prisma } from "@/lib/prisma";

type IntegrationEvent =
  | "LIST_PRODUCT"
  | "DELIST_PRODUCT"
  | "CONFIRM_ORDER"
  | "SHIP_ORDER"
  | "CANCEL_ORDER";

export async function dispatchIntegration(
  channelId: string,
  event: IntegrationEvent,
  payload: any
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
  } catch (error: any) {
    await prisma.integrationLog.create({
      data: {
        channelId,
        eventType: event,
        payload,
        response: { error: error.message },
        status: "FAILED",
      },
    });

    throw error;
  }
}