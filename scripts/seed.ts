import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.channel.createMany({
    data: [
      { name: "AMAZON" },
      { name: "FLIPKART" },
      { name: "MEESHO" },
    ],
    skipDuplicates: true,
  });

  console.log("Channels seeded.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());