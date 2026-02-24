import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function ProductContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!product) return <div>Product not found</div>;

  async function saveContent(formData: FormData) {
    "use server";

    const description = formData.get("description") as string;
    const metaTitle = formData.get("metaTitle") as string;
    const metaDescription = formData.get("metaDescription") as string;
    const attributesRaw = formData.get("attributes") as string;

    let attributes: any = null;

    try {
      attributes = attributesRaw
        ? JSON.parse(attributesRaw)
        : null;
    } catch {
      throw new Error("INVALID_JSON");
    }

    // Image URLs (comma separated or multiple inputs)
    const imageUrls = formData
      .getAll("imageUrl")
      .map((v) => v.toString())
      .filter(Boolean);

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          description,
          metaTitle,
          metaDescription,
          attributes,
        },
      });

      // Remove existing images
      await tx.productImage.deleteMany({
        where: { productId: id },
      });

      // Re-create images
      for (let i = 0; i < imageUrls.length; i++) {
        await tx.productImage.create({
          data: {
            productId: id,
            url: imageUrls[i],
            sourceType: "URL",
            sortOrder: i,
          },
        });
      }
    });

    revalidatePath(`/products/${id}/content`);
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Manage Content — {product.name}</h1>

      <form action={saveContent}>
        <div>
          <label>Description</label>
          <br />
          <textarea
            name="description"
            defaultValue={product.description ?? ""}
            rows={5}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <label>Meta Title</label>
          <br />
          <input
            name="metaTitle"
            defaultValue={product.metaTitle ?? ""}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <label>Meta Description</label>
          <br />
          <textarea
            name="metaDescription"
            defaultValue={product.metaDescription ?? ""}
            rows={3}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <label>Attributes (JSON)</label>
          <br />
          <textarea
            name="attributes"
            defaultValue={
              product.attributes
                ? JSON.stringify(product.attributes, null, 2)
                : ""
            }
            rows={6}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <label>Images (Add multiple URLs)</label>
          <br />
          {product.images.map((img) => (
            <input
              key={img.id}
              name="imageUrl"
              defaultValue={img.url ?? ""}
              style={{ display: "block", width: "100%", marginBottom: 6 }}
            />
          ))}

          {/* Empty input for adding new */}
          <input
            name="imageUrl"
            placeholder="https://cdn.example.com/image.jpg"
            style={{ display: "block", width: "100%", marginTop: 6 }}
          />
        </div>

        <button style={{ marginTop: 20 }} type="submit">
          Save Content
        </button>
      </form>
    </div>
  );
}