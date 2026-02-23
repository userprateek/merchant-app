import { getProducts, addProduct } from "@/features/merchant/service";
import { revalidatePath } from "next/cache";
import ProductForm from "@/features/merchant/components/ProductForm";
import ProductList from "@/features/merchant/components/ProductList";
import { adjustStock } from "@/features/merchant/service";

export default async function ProductsPage() {
  const products = await getProducts();

  async function createProduct(prevState: any, formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const sku = (formData.get("sku") as string).trim().toUpperCase();
    const price = Number(formData.get("price"));
    const quantity = Number(formData.get("quantity"));

    try {
      await addProduct({
        name,
        sku,
        price,
        quantity,
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

  async function increaseStock(id: string) {
    "use server";
    adjustStock(id, 1);
    revalidatePath("/products");
  }

  async function decreaseStock(id: string) {
    "use server";
    adjustStock(id, -1);
    revalidatePath("/products");
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Inventory</h1>
      <ProductForm action={createProduct} />
      <ProductList
        products={products}
        increaseStock={increaseStock}
        decreaseStock={decreaseStock}
      />
    </div>
  );
}
