"use client";

import { useState } from "react";

type Props = {
  product: any;
  channels: any[];
  saveListingAction: (formData: FormData) => void;
  delistAction: (formData: FormData) => void;
};

export default function ChannelListingManager({
  product,
  channels,
  saveListingAction,
  delistAction,
}: Props) {
  const [editingChannelId, setEditingChannelId] =
    useState<string | null>(null);

  const [discountMap, setDiscountMap] = useState<Record<string, number>>({});
  const [markupMap, setMarkupMap] = useState<Record<string, number>>({});

  function handleChange(
    channelId: string,
    type: "discount" | "markup",
    value: number
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
    const discount = discountMap[channelId] ?? 0;
    const markup = markupMap[channelId] ?? 0;

    return basePrice - discount + markup;
  }

  function confirmDelist(listingId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delist?"
    );

    if (!confirmed) return;

    const formData = new FormData();
    formData.append("listingId", listingId);
    formData.append("productId", product.id);

    delistAction(formData);
  }

  return (
    <table
      border={1}
      cellPadding={8}
      style={{ marginTop: 20, width: "100%" }}
    >
      <thead>
        <tr>
          <th>Channel</th>
          <th>Base Price</th>
          <th>Discount</th>
          <th>Markup</th>
          <th>Final Price</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        {channels.map((channel) => {
          const listing = product.listings.find(
            (l: any) => l.channelId === channel.id
          );

          const isEditing = editingChannelId === channel.id;

          const discount =
            discountMap[channel.id] ??
            listing?.discountAmount ??
            0;

          const markup =
            markupMap[channel.id] ??
            listing?.markupAmount ??
            0;

          const finalPrice = getFinalPrice(
            channel.id,
            product.basePrice
          );

          return (
            <tr key={channel.id}>
              <td>{channel.name}</td>

              <td>₹{product.basePrice}</td>

              <td>
                <input
                  type="number"
                  value={discount}
                  readOnly={!isEditing}
                  onChange={(e) =>
                    handleChange(
                      channel.id,
                      "discount",
                      Number(e.target.value)
                    )
                  }
                />
              </td>

              <td>
                <input
                  type="number"
                  value={markup}
                  readOnly={!isEditing}
                  onChange={(e) =>
                    handleChange(
                      channel.id,
                      "markup",
                      Number(e.target.value)
                    )
                  }
                />
              </td>

              <td>₹{finalPrice}</td>

              <td>
                {listing
                  ? listing.listingStatus
                  : "Not Listed"}
              </td>

              <td>
                {!listing && !isEditing && (
                  <button
                    onClick={() =>
                      setEditingChannelId(channel.id)
                    }
                  >
                    List
                  </button>
                )}

                {listing && !isEditing && (
                  <>
                    <button
                      onClick={() =>
                        setEditingChannelId(channel.id)
                      }
                    >
                      Update
                    </button>

                    <button
                      onClick={() =>
                        confirmDelist(listing.id)
                      }
                    >
                      Delist
                    </button>
                  </>
                )}

                {isEditing && (
                  <>
                    <form action={saveListingAction}>
                      <input
                        type="hidden"
                        name="productId"
                        value={product.id}
                      />
                      <input
                        type="hidden"
                        name="channelId"
                        value={channel.id}
                      />
                      <input
                        type="hidden"
                        name="discount"
                        value={discount}
                      />
                      <input
                        type="hidden"
                        name="markup"
                        value={markup}
                      />

                      <button type="submit">
                        Save
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingChannelId(null)
                      }
                    >
                      Cancel
                    </button>
                  </>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}