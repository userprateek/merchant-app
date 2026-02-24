import { Product } from "@prisma/client";
import StockAdjuster from "./StockAdjuster";
import Link from "next/link";
type Props = {
  products: any[];
  channels: any[];
  increaseStock: (id: string) => void;
  decreaseStock: (id: string) => void;
};
export default function ProductList(Props: Props) {
  const { products, channels, increaseStock, decreaseStock } = Props;
  if (products.length === 0) {
    return <p>No products yet.</p>;
  }

  return (
    <table border={1} cellPadding={8} style={{ marginTop: 20, width: "100%" }}>
      <thead>
        <tr>
          <th>Name</th>
          <th>SKU</th>
          <th>Base Price</th>
          <th>Quantity</th>
          <th>Status</th>

          {/* Dynamic Channel Columns */}
          {channels.map((channel) => (
            <th key={channel.id}>{channel.name}</th>
          ))}
          <th>Manage</th>
        </tr>
      </thead>

      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{product.sku}</td>
            <td>₹{product.basePrice}</td>
            <td>{product.totalStock}</td>
            <td>{product.status}</td>

            {/* Channel Cells */}
            {channels.map((channel) => {
              const listing = product.listings?.find(
                (l: any) => l.channelId === channel.id,
              );

              return (
                <td key={channel.id}>
                  {listing ? (
                    <>
                      {listing.listingStatus}
                      <br />₹{listing.currentPrice}
                    </>
                  ) : (
                    "Not Listed"
                  )}
                </td>
              );
            })}
            <td>
              <Link href={`/products/${product.id}/listings`}>Manage</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
