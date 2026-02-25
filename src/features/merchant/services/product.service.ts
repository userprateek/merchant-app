import { prisma } from "@/lib/prisma";
import { Prisma, ProductStatus } from "@prisma/client";

export async function getProducts() {
  return prisma.product.findMany({
    include: {
      listings: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProduct(data: {
  sku: string;
  name: string;
  basePrice: number;
  totalStock: number;
}) {
  const normalizedSku = data.sku.trim().toUpperCase();

  try {
    return await prisma.product.create({
      data: {
        name: data.name,
        sku: normalizedSku,
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

export async function updateStock(productId: string, delta: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  const newQty = Math.max(0, product.totalStock + delta);

  return prisma.product.update({
    where: { id: productId },
    data: { totalStock: newQty },
  });
}

export async function deleteProduct(id: string) {
  return prisma.product.delete({
    where: { id },
  });
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    basePrice: number;
    status: ProductStatus;
  }
) {
  return prisma.product.update({
    where: { id },
    data,
  });
}
