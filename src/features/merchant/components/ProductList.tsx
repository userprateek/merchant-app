"use client";

import ConfirmButton from "@/components/ConfirmButton";
import Link from "next/link";
import { useRef } from "react";
import DataTable, { DataTableColumn } from "@/components/DataTable";

type ProductWithListings = {
  id: string;
  name: string;
  sku: string;
  basePrice: number;
  totalStock: number;
  reservedStock: number;
  status: string;
  listings: {
    channelId: string;
    listingStatus: string;
    currentPrice: number;
  }[];
};

type Channel = {
  id: string;
  name: string;
};

type Props = {
  products: ProductWithListings[];
  channels: Channel[];
  increaseStock: (formData: FormData) => Promise<void>;
  decreaseStock: (formData: FormData) => Promise<void>;
};

function StockActions({
  productId,
  increaseStock,
  decreaseStock,
}: {
  productId: string;
  increaseStock: (formData: FormData) => Promise<void>;
  decreaseStock: (formData: FormData) => Promise<void>;
}) {
  const incRef = useRef<HTMLFormElement>(null);
  const decRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <form ref={incRef} action={increaseStock}>
        <input type="hidden" name="id" value={productId} />
      </form>

      <form ref={decRef} action={decreaseStock}>
        <input type="hidden" name="id" value={productId} />
      </form>

      <div className="actions-row">
        <div>
          <ConfirmButton
            message="Increase stock by 1?"
            onConfirm={() => incRef.current?.requestSubmit()}
          >
            +1
          </ConfirmButton>
        </div>
        <div>
          <ConfirmButton
            message="Decrease stock by 1?"
            onConfirm={() => decRef.current?.requestSubmit()}
          >
            -1
          </ConfirmButton>
        </div>
      </div>
    </>
  );
}

export default function ProductList({
  products,
  channels,
  increaseStock,
  decreaseStock,
}: Props) {
  if (products.length === 0) {
    return <p>No products yet.</p>;
  }

  const baseColumns: DataTableColumn<ProductWithListings>[] = [
    { field: "name", header: "Name" },
    { field: "sku", header: "SKU" },
    {
      field: "basePrice",
      header: "Base Price",
      align: "right",
      render: (product) => `₹${product.basePrice}`,
    },
    {
      field: "totalStock",
      header: "Total",
      align: "right",
      render: (product) => product.totalStock,
    },
    {
      field: "reservedStock",
      header: "Reserved",
      align: "right",
      render: (product) => product.reservedStock,
    },
    {
      field: "availableStock",
      header: "Available",
      align: "right",
      render: (product) => product.totalStock - product.reservedStock,
    },
    {
      field: "adjust",
      header: "Adjust",
      render: (product) => (
        <StockActions
          productId={product.id}
          increaseStock={increaseStock}
          decreaseStock={decreaseStock}
        />
      ),
    },
    { field: "status", header: "Status" },
  ];

  const channelColumns: DataTableColumn<ProductWithListings>[] = channels.map(
    (channel) => ({
      field: channel.id,
      header: channel.name,
      render: (product) => {
        const listing = product.listings.find(
          (channelListing) => channelListing.channelId === channel.id,
        );
        if (!listing) return "Not Listed";
        return (
          <>
            <div>{listing.listingStatus}</div>
            <div className="inventory-muted">₹{listing.currentPrice}</div>
          </>
        );
      },
    }),
  );

  const manageColumn: DataTableColumn<ProductWithListings> = {
    field: "manage",
    header: "Manage",
    render: (product) => (
      <div className="inventory-actions">
        <Link href={`/products/${product.id}/listings`}>Listings</Link>
        <Link href={`/products/${product.id}/content`}>Content</Link>
        <Link href={`/products/${product.id}/edit`}>Edit</Link>
      </div>
    ),
  };

  const columns = [...baseColumns, ...channelColumns, manageColumn];

  return (
    <div>
      <DataTable columns={columns} rows={products} rowKey="id" />
    </div>
  );
}
