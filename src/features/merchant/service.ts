import { prisma } from "@/lib/prisma";
import { Prisma, ProductStatus } from "@prisma/client";

export async function getProducts() {
  return prisma.product.findMany({
    include: {
      listings: {
        include: {
          channel: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addProduct(data: {
  name: string;
  sku: string;
  basePrice: number;
  totalStock: number;
}) {
  try {
    return await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        basePrice: data.basePrice,
        totalStock: data.totalStock,
        reservedStock: 0,
        status: ProductStatus.ACTIVE,
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

  const newQty = Math.max(0, product.totalStock + delta);

  return prisma.product.update({
    where: { id },
    data: { totalStock: newQty },
  });
}

export async function deleteProduct(id: string) {
  return prisma.product.delete({
    where: { id },
  });
}
