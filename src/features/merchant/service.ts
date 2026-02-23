import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
}


export async function addProduct(data: {
  name: string;
  sku: string;
  price: number;
  quantity: number;
}) {
  try {
    return await prisma.product.create({
      data: {
        ...data,
        status: "ACTIVE",
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("SKU_ALREADY_EXISTS");
    }

    throw error;
  }
}

export async function adjustStock(id: string, delta: number) {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) return;

  const newQty = Math.max(0, product.quantity + delta);

  return prisma.product.update({
    where: { id },
    data: { quantity: newQty },
  });
}

export async function deleteProduct(id: string) {
  return prisma.product.delete({
    where: { id },
  });
}