import { dispatchIntegration, IntegrationEvent } from "@/features/integrations/dispatcher";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function retryIntegrationLog(logId: string) {
  const log = await prisma.integrationLog.findUnique({
    where: { id: logId },
  });

  if (!log) {
    throw new Error("INTEGRATION_LOG_NOT_FOUND");
  }

  const event = log.eventType as IntegrationEvent;
  return dispatchIntegration(
    log.channelId,
    event,
    log.payload as Prisma.InputJsonValue
  );
}
