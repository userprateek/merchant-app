import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import DataTable, { DataTableColumn } from "@/components/DataTable";

export default async function DashboardPage() {
  await requireRole([
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PACKING_CREW,
    UserRole.VIEWER,
  ]);

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
  const lowStockColumns: DataTableColumn<(typeof lowStockProducts)[number]>[] = [
    { field: "sku", header: "SKU" },
    { field: "name", header: "Name" },
    { field: "totalStock", header: "Total", align: "right" },
    { field: "reservedStock", header: "Reserved", align: "right" },
    {
      field: "available",
      header: "Available",
      align: "right",
      render: (product) => product.totalStock - product.reservedStock,
    },
  ];

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
      <DataTable
        columns={lowStockColumns}
        rows={lowStockProducts}
        rowKey="id"
        emptyMessage="No low-stock products."
      />
    </div>
  );
}
