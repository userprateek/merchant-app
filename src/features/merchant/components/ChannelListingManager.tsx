"use client";

import { useState, useRef } from "react";
import ConfirmButton from "@/components/ConfirmButton";
import AppButton from "@/components/AppButton";
import DataTable, { DataTableColumn } from "@/components/DataTable";

type Listing = {
  id: string;
  channelId: string;
  listingStatus: string;
  discountAmount: number | null;
  markupAmount: number | null;
};

type ProductForListings = {
  id: string;
  name: string;
  sku: string;
  basePrice: number;
  listings: Listing[];
};

type Props = {
  product: ProductForListings;
  channels: {
    id: string;
    name: string;
    isEnabled: boolean;
  }[];
  saveListingAction: (formData: FormData) => Promise<void>;
  delistAction: (formData: FormData) => Promise<void>;
};

export default function ChannelListingManager({
  product,
  channels,
  saveListingAction,
  delistAction,
}: Props) {
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);

  const [discountMap, setDiscountMap] = useState<Record<string, number>>({});

  const [markupMap, setMarkupMap] = useState<Record<string, number>>({});

  const formRefs = useRef<Record<string, HTMLFormElement | null>>({});

  function handleChange(
    channelId: string,
    type: "discount" | "markup",
    value: number,
  ) {
    if (type === "discount") {
      setDiscountMap((prev) => ({
        ...prev,
        [channelId]: value,
      }));
    } else {
      setMarkupMap((prev) => ({
        ...prev,
        [channelId]: value,
      }));
    }
  }

  function getFinalPrice(channelId: string, basePrice: number) {
    const discount =
      discountMap[channelId] ??
      product.listings.find((l) => l.channelId === channelId)
        ?.discountAmount ??
      0;

    const markup =
      markupMap[channelId] ??
      product.listings.find((l) => l.channelId === channelId)
        ?.markupAmount ??
      0;

    return basePrice - discount + markup;
  }

  const activeChannels = channels.filter((c) => c.isEnabled);
  const columns: DataTableColumn<(typeof activeChannels)[number]>[] = [
    { field: "name", header: "Channel" },
    {
      field: "basePrice",
      header: "Base Price",
      align: "right",
      render: () => `₹${product.basePrice}`,
    },
    {
      field: "discount",
      header: "Discount",
      render: (channel) => {
        const listing = product.listings.find((l) => l.channelId === channel.id);
        const isEditing = editingChannelId === channel.id;
        const discount = discountMap[channel.id] ?? listing?.discountAmount ?? 0;
        return (
          <input
            type="number"
            value={discount}
            readOnly={!isEditing}
            onChange={(e) =>
              handleChange(channel.id, "discount", Number(e.target.value))
            }
          />
        );
      },
    },
    {
      field: "markup",
      header: "Markup",
      render: (channel) => {
        const listing = product.listings.find((l) => l.channelId === channel.id);
        const isEditing = editingChannelId === channel.id;
        const markup = markupMap[channel.id] ?? listing?.markupAmount ?? 0;
        return (
          <input
            type="number"
            value={markup}
            readOnly={!isEditing}
            onChange={(e) =>
              handleChange(channel.id, "markup", Number(e.target.value))
            }
          />
        );
      },
    },
    {
      field: "finalPrice",
      header: "Final Price",
      align: "right",
      render: (channel) => `₹${getFinalPrice(channel.id, product.basePrice)}`,
    },
    {
      field: "status",
      header: "Status",
      render: (channel) => {
        const listing = product.listings.find((l) => l.channelId === channel.id);
        return (
          <>
            {!channel.isEnabled && "Disabled"}
            {listing ? listing.listingStatus : "Not Listed"}
          </>
        );
      },
    },
    {
      field: "action",
      header: "Action",
      render: (channel) => {
        const listing = product.listings.find((l) => l.channelId === channel.id);
        const isEditing = editingChannelId === channel.id;
        const discount = discountMap[channel.id] ?? listing?.discountAmount ?? 0;
        const markup = markupMap[channel.id] ?? listing?.markupAmount ?? 0;

        return (
          <>
            {!listing && !isEditing && (
              <AppButton onClick={() => setEditingChannelId(channel.id)}>
                List
              </AppButton>
            )}

            {listing && !isEditing && (
              <>
                <AppButton onClick={() => setEditingChannelId(channel.id)}>
                  Update
                </AppButton>

                <ConfirmButton
                  message="Are you sure you want to delist this product?"
                  onConfirm={() => {
                    const formData = new FormData();
                    formData.append("listingId", listing.id);
                    formData.append("productId", product.id);
                    delistAction(formData);
                  }}
                >
                  Delist
                </ConfirmButton>
              </>
            )}

            {isEditing && (
              <>
                <form
                  ref={(el) => {
                    formRefs.current[channel.id] = el;
                  }}
                  action={saveListingAction}
                >
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="channelId" value={channel.id} />
                  <input type="hidden" name="discount" value={discount} />
                  <input type="hidden" name="markup" value={markup} />
                </form>

                <ConfirmButton
                  message="Confirm listing with this pricing?"
                  onConfirm={() => formRefs.current[channel.id]?.requestSubmit()}
                >
                  Save
                </ConfirmButton>

                <AppButton
                  type="button"
                  onClick={() => setEditingChannelId(null)}
                >
                  Cancel
                </AppButton>
              </>
            )}
          </>
        );
      },
    },
  ];

  return (
    <div>
      <DataTable columns={columns} rows={activeChannels} rowKey="id" />
    </div>
  );
}
