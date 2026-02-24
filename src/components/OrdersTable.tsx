"use client";

import { useState } from "react";

type Order = {
  id: string;
  externalOrderId: string;
  status: string;
  totalAmount: number;
  channel: {
    name: string;
  };
  createdAt: Date;
};

type Props = {
  orders: Order[];
  onBulkConfirm: (ids: string[]) => void;
  onBulkShip: (ids: string[]) => void;
  onBulkCancel: (ids: string[]) => void;
};

export default function OrdersTable({
  orders,
  onBulkConfirm,
  onBulkShip,
  onBulkCancel,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  function toggleAll() {
    if (selected.length === orders.length) {
      setSelected([]);
    } else {
      setSelected(orders.map((o) => o.id));
    }
  }

  function clearSelection() {
    setSelected([]);
  }

  const selectedOrders = orders.filter((o) =>
    selected.includes(o.id)
  );

  const allCreated = selectedOrders.every(
    (o) => o.status === "CREATED"
  );

  const allConfirmed = selectedOrders.every(
    (o) => o.status === "CONFIRMED"
  );

  return (
    <>
      {/* Bulk Actions */}
      <div style={{ marginBottom: 16 }}>
        <button
          disabled={selected.length === 0 || !allCreated}
          onClick={() => {
            onBulkConfirm(selected);
            clearSelection();
          }}
        >
          Confirm Selected
        </button>

        <button
          disabled={selected.length === 0 || !allConfirmed}
          onClick={() => {
            onBulkShip(selected);
            clearSelection();
          }}
          style={{ marginLeft: 8 }}
        >
          Ship Selected
        </button>

        <button
          disabled={selected.length === 0}
          onClick={() => {
            if (confirm("Are you sure you want to cancel selected orders?")) {
              onBulkCancel(selected);
              clearSelection();
            }
          }}
          style={{ marginLeft: 8 }}
        >
          Cancel Selected
        </button>
      </div>

      {/* Orders Table */}
      <table
        border={1}
        cellPadding={8}
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={
                  selected.length > 0 &&
                  selected.length === orders.length
                }
                onChange={toggleAll}
              />
            </th>
            <th>Order #</th>
            <th>Channel</th>
            <th>Status</th>
            <th>Total</th>
            <th>Created</th>
            <th>Manage</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.includes(order.id)}
                  onChange={() => toggle(order.id)}
                />
              </td>
              <td>{order.externalOrderId}</td>
              <td>{order.channel.name}</td>
              <td>{order.status}</td>
              <td>₹{order.totalAmount}</td>
              <td>
                {new Date(order.createdAt).toLocaleString()}
              </td>
              <td>
                <a href={`/orders/${order.id}`}>Manage</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}