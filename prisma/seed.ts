import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  // Clear tables (safe for dev)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.channelListing.deleteMany();
  await prisma.product.deleteMany();
  await prisma.channel.deleteMany();

  // Create Channels
  const amazon = await prisma.channel.create({
    data: { name: "AMAZON" },
  });

  const flipkart = await prisma.channel.create({
    data: { name: "FLIPKART" },
  });

  // Create Products
  const product1 = await prisma.product.create({
    data: {
      sku: "BAG001",
      name: "Leather Bag",
      basePrice: 1000,
      totalStock: 50,
      reservedStock: 0,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      sku: "WALLET001",
      name: "Leather Wallet",
      basePrice: 500,
      totalStock: 100,
      reservedStock: 0,
    },
  });

  // Create Orders
  await prisma.order.create({
    data: {
      channelId: amazon.id,
      externalOrderId: "AMZ-1001",
      totalAmount: 2000,
      status: "CREATED",
      createdAt: new Date(),
      items: {
        create: [
          {
            productId: product1.id,
            quantity: 2,
            unitPrice: 1000,
            totalPrice: 2000,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      channelId: flipkart.id,
      externalOrderId: "FLP-2001",
      totalAmount: 500,
      status: "CONFIRMED",
      createdAt: new Date(),
      items: {
        create: [
          {
            productId: product2.id,
            quantity: 1,
            unitPrice: 500,
            totalPrice: 500,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      channelId: amazon.id,
      externalOrderId: "AMZ-1002",
      totalAmount: 1500,
      status: "SHIPPED",
      createdAt: new Date(),
      items: {
        create: [
          {
            productId: product1.id,
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
          },
          {
            productId: product2.id,
            quantity: 1,
            unitPrice: 500,
            totalPrice: 500,
          },
        ],
      },
    },
  });

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
