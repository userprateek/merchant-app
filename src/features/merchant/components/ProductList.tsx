import { Product } from "@prisma/client";
import StockAdjuster from "./StockAdjuster";

export default function ProductList({
  products,
  increaseStock,
  decreaseStock,
}: {
  products: Product[];
  increaseStock: (id: string) => void;
  decreaseStock: (id: string) => void;
}) {
  if (products.length === 0) {
    return <p>No products yet.</p>;
  }

  return (
    <table border={1} cellPadding={8} style={{ marginTop: 20 }}>
      <thead>
        <tr>
          <th>Name</th>
          <th>SKU</th>
          <th>Price</th>
          <th>Quantity</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{product.sku}</td>
            <td>{product.price}</td>
            <td>
              {product.quantity}
              <StockAdjuster
                id={product.id}
                increase={increaseStock}
                decrease={decreaseStock}
              />
            </td>
            <td>{product.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
