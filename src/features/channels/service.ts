import { prisma } from "@/lib/prisma";

export async function getChannels() {
  return prisma.channel.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function updateChannelConfig(
  id: string,
  data: {
    baseUrl?: string;
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    webhookSecret?: string;
    isEnabled?: boolean;
    isSandbox?: boolean;
  }
) {
  return prisma.channel.update({
    where: { id },
    data,
  });
}

export async function enableChannel(id: string) {
  return prisma.channel.update({
    where: { id },
    data: { isEnabled: true },
  });
}

export async function disableChannel(id: string) {
  return prisma.channel.update({
    where: { id },
    data: { isEnabled: false },
  });
}