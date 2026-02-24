"use client";

import ConfirmButton from "@/components/ConfirmButton";
import Link from "next/link";
import { useRef } from "react";

type Props = {
  products: any[];
  channels: any[];
  increaseStock: (formData: FormData) => Promise<void>;
  decreaseStock: (formData: FormData) => Promise<void>;
};

export default function ProductList({
  products,
  channels,
  increaseStock,
  decreaseStock,
}: Props) {
  if (products.length === 0) {
    return <p>No products yet.</p>;
  }

  return (
    <table
      border={1}
      cellPadding={8}
      style={{ marginTop: 20, width: "100%", borderCollapse: "collapse" }}
    >
      <thead>
        <tr>
          <th>Name</th>
          <th>SKU</th>
          <th>Base Price</th>
          <th>Stock</th>
          <th>Status</th>

          {channels.map((channel) => (
            <th key={channel.id}>{channel.name}</th>
          ))}

          <th>Manage</th>
        </tr>
      </thead>

      <tbody>
        {products.map((product) => {
          const available =
            product.totalStock - product.reservedStock;

          // ✅ Per-row refs
          const incRef = useRef<HTMLFormElement>(null);
          const decRef = useRef<HTMLFormElement>(null);

          return (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.sku}</td>
              <td>₹{product.basePrice}</td>

              <td>
                <div>Total: {product.totalStock}</div>
                <div>Reserved: {product.reservedStock}</div>
                <div>
                  <strong>Available: {available}</strong>
                </div>

                {/* Hidden Forms */}
                <form ref={incRef} action={increaseStock}>
                  <input type="hidden" name="id" value={product.id} />
                </form>

                <form ref={decRef} action={decreaseStock}>
                  <input type="hidden" name="id" value={product.id} />
                </form>

                <div style={{ marginTop: 6 }}>
                  <ConfirmButton
                    message="Increase stock by 1?"
                    onConfirm={() => incRef.current?.requestSubmit()}
                  >
                    +1
                  </ConfirmButton>

                  <ConfirmButton
                    message="Decrease stock by 1?"
                    onConfirm={() => decRef.current?.requestSubmit()}
                    style={{ marginLeft: 6 }}
                  >
                    -1
                  </ConfirmButton>
                </div>
              </td>

              <td>{product.status}</td>

              {channels.map((channel) => {
                const listing = product.listings?.find(
                  (l: any) => l.channelId === channel.id
                );

                return (
                  <td key={channel.id}>
                    {listing ? (
                      <>
                        {listing.listingStatus}
                        <br />
                        ₹{listing.currentPrice}
                      </>
                    ) : (
                      "Not Listed"
                    )}
                  </td>
                );
              })}

              <td>
                <Link href={`/products/${product.id}/listings`}>
                  Manage
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}