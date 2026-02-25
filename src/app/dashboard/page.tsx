import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [
    totalProducts,
    totalOrders,
    activeListings,
    lowStockCandidates,
    orderCounts,
  ] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.channelListing.count({
        where: { listingStatus: "LISTED" },
      }),
      prisma.product.findMany({
        where: { totalStock: { lte: 10 } },
        orderBy: { totalStock: "asc" },
        take: 100,
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);
  const lowStockProducts = lowStockCandidates.filter(
    (product) => product.totalStock <= 5 || product.totalStock <= product.reservedStock
  );

  return (
    <div style={{ padding: 24 }}>
      <h1>Analytics Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <div style={{ border: "1px solid #ddd", padding: 12 }}>
          <strong>Products</strong>
          <div>{totalProducts}</div>
        </div>
        <div style={{ border: "1px solid #ddd", padding: 12 }}>
          <strong>Orders</strong>
          <div>{totalOrders}</div>
        </div>
        <div style={{ border: "1px solid #ddd", padding: 12 }}>
          <strong>Active Listings</strong>
          <div>{activeListings}</div>
        </div>
      </div>

      <h2 style={{ marginTop: 24 }}>Order Status Breakdown</h2>
      <ul>
        {orderCounts.map((item) => (
          <li key={item.status}>
            {item.status}: {item._count._all}
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: 24 }}>Low Stock / At Risk</h2>
      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Total</th>
            <th>Reserved</th>
            <th>Available</th>
          </tr>
        </thead>
        <tbody>
          {lowStockProducts.map((product) => (
            <tr key={product.id}>
              <td>{product.sku}</td>
              <td>{product.name}</td>
              <td>{product.totalStock}</td>
              <td>{product.reservedStock}</td>
              <td>{product.totalStock - product.reservedStock}</td>
            </tr>
          ))}
          {lowStockProducts.length === 0 && (
            <tr>
              <td colSpan={5}>No low-stock products.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
