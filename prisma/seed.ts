import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function md5(value: string) {
  return createHash("md5").update(value).digest("hex");
}

function seedPasswordHash(password: string, salt: string) {
  const pepper = process.env.PASSWORD_PEPPER ?? "dev_pepper_change_me";
  return md5(`${salt}:${password}:${pepper}`);
}

async function main() {
  console.log("Seeding...");

  // Clear tables (safe for dev)
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
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

  const adminSalt = "seed_admin_salt";
  const managerSalt = "seed_manager_salt";
  const packerSalt = "seed_packer_salt";
  const viewerSalt = "seed_viewer_salt";

  await prisma.user.createMany({
    data: [
      {
        name: "Admin User",
        email: "admin@merchant.local",
        passwordSalt: adminSalt,
        passwordHash: seedPasswordHash("admin123", adminSalt),
        role: "ADMIN",
      },
      {
        name: "Manager User",
        email: "manager@merchant.local",
        passwordSalt: managerSalt,
        passwordHash: seedPasswordHash("manager123", managerSalt),
        role: "MANAGER",
      },
      {
        name: "Packing Crew",
        email: "packing@merchant.local",
        passwordSalt: packerSalt,
        passwordHash: seedPasswordHash("packing123", packerSalt),
        role: "PACKING_CREW",
      },
      {
        name: "Viewer User",
        email: "viewer@merchant.local",
        passwordSalt: viewerSalt,
        passwordHash: seedPasswordHash("viewer123", viewerSalt),
        role: "VIEWER",
      },
    ],
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
