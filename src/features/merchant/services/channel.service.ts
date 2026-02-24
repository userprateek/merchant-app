import { prisma } from "@/lib/prisma";

export async function getChannels() {
  return prisma.channel.findMany({
    orderBy: { name: "asc" },
  });
}