import { prisma } from "@/lib/prisma";
import { getProducts, addProduct } from "@/features/merchant/service";
import { getChannels } from "@/features/merchant/services/channel.service";
import { revalidatePath } from "next/cache";
import ProductForm from "@/features/merchant/components/ProductForm";
import ProductList from "@/features/merchant/components/ProductList";

export default async function ProductsPage() {
  const products = await getProducts();
  const channels = await getChannels();

  /*
  |--------------------------------------------------------------------------
  | CREATE PRODUCT
  |--------------------------------------------------------------------------
  */

  async function createProduct(prevState: any, formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const sku = (formData.get("sku") as string).trim().toUpperCase();
    const basePrice = Number(formData.get("basePrice"));
    const totalStock = Number(formData.get("totalStock"));

    try {
      await addProduct({
        name,
        sku,
        basePrice,
        totalStock,
      });

      revalidatePath("/products");
      return { success: true };
    } catch (error: any) {
      if (error.message === "SKU_ALREADY_EXISTS") {
        return { error: "SKU already exists" };
      }

      throw error;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | INCREASE STOCK
  |--------------------------------------------------------------------------
  */

  async function increaseStock(formData: FormData) {
    "use server";

    const id = formData.get("id") as string;

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { totalStock: { increment: 1 } },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: id,
          type: "MANUAL_ADJUST",
          quantity: 1,
          reference: "MANUAL",
        },
      });
    });

    revalidatePath("/products");
  }

  /*
  |--------------------------------------------------------------------------
  | DECREASE STOCK
  |--------------------------------------------------------------------------
  */

  async function decreaseStock(formData: FormData) {
    "use server";

    const id = formData.get("id") as string;

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { totalStock: { decrement: 1 } },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: id,
          type: "MANUAL_ADJUST",
          quantity: -1,
          reference: "MANUAL",
        },
      });
    });

    revalidatePath("/products");
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Inventory</h1>

      <ProductForm action={createProduct} />

      <ProductList
        products={products}
        channels={channels}
        increaseStock={increaseStock}
        decreaseStock={decreaseStock}
      />
    </div>
  );
}