import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getOptionalString } from "@/lib/validation";
import { requireRole } from "@/lib/auth";
import AppButton from "@/components/AppButton";

export default async function ProductContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole([UserRole.ADMIN, UserRole.MANAGER]);

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!product) return <div>Product not found</div>;

  async function saveContent(formData: FormData) {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);

    const description = getOptionalString(formData, "description");
    const metaTitle = getOptionalString(formData, "metaTitle");
    const metaDescription = getOptionalString(formData, "metaDescription");
    const attributesRaw = getOptionalString(formData, "attributes");

    let attributes: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
      Prisma.JsonNull;

    try {
      attributes = attributesRaw
        ? (JSON.parse(attributesRaw) as Prisma.InputJsonValue)
        : Prisma.JsonNull;
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
    <div className="app-shell app-shell--narrow">
      <div className="page-header">
        <h1 className="page-title">Manage Content — {product.name}</h1>
      </div>

      <form action={saveContent} className="section-card">
        <div className="field-block">
          <label className="surface-label">Description</label>
          <textarea
            className="surface-textarea"
            name="description"
            defaultValue={product.description ?? ""}
            rows={5}
          />
        </div>

        <div className="field-block">
          <label className="surface-label">Meta Title</label>
          <input
            className="surface-input"
            name="metaTitle"
            defaultValue={product.metaTitle ?? ""}
          />
        </div>

        <div className="field-block">
          <label className="surface-label">Meta Description</label>
          <textarea
            className="surface-textarea"
            name="metaDescription"
            defaultValue={product.metaDescription ?? ""}
            rows={3}
          />
        </div>

        <div className="field-block">
          <label className="surface-label">Attributes (JSON)</label>
          <textarea
            className="surface-textarea"
            name="attributes"
            defaultValue={
              product.attributes
                ? JSON.stringify(product.attributes, null, 2)
                : ""
            }
            rows={6}
          />
        </div>

        <div className="field-block">
          <label className="surface-label">Images (Add multiple URLs)</label>
          <div className="stack-sm">
            {product.images.map((img) => (
              <input
                className="surface-input"
                key={img.id}
                name="imageUrl"
                defaultValue={img.url ?? ""}
              />
            ))}

            {/* Empty input for adding new */}
            <input
              className="surface-input"
              name="imageUrl"
              placeholder="https://cdn.example.com/image.jpg"
            />
          </div>
        </div>

        <AppButton style={{ marginTop: 16 }} type="submit">
          Save Content
        </AppButton>
      </form>
    </div>
  );
}
