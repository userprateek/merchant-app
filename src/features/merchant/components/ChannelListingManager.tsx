"use client";

import { useState, useRef } from "react";
import ConfirmButton from "@/components/ConfirmButton";

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
      product.listings.find((l: any) => l.channelId === channelId)
        ?.discountAmount ??
      0;

    const markup =
      markupMap[channelId] ??
      product.listings.find((l: any) => l.channelId === channelId)
        ?.markupAmount ??
      0;

    return basePrice - discount + markup;
  }

  const activeChannels = channels.filter((c) => c.isEnabled);
  return (
    <table
      border={1}
      cellPadding={8}
      style={{
        marginTop: 20,
        width: "100%",
        borderCollapse: "collapse",
      }}
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
        {activeChannels.map((channel) => {
          const listing = product.listings.find(
            (l: any) => l.channelId === channel.id,
          );

          const isEditing = editingChannelId === channel.id;

          const discount =
            discountMap[channel.id] ?? listing?.discountAmount ?? 0;

          const markup = markupMap[channel.id] ?? listing?.markupAmount ?? 0;

          const finalPrice = getFinalPrice(channel.id, product.basePrice);

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
                    handleChange(channel.id, "discount", Number(e.target.value))
                  }
                />
              </td>

              <td>
                <input
                  type="number"
                  value={markup}
                  readOnly={!isEditing}
                  onChange={(e) =>
                    handleChange(channel.id, "markup", Number(e.target.value))
                  }
                />
              </td>

              <td>₹{finalPrice}</td>

              <td>
                {!channel.isEnabled && "Disabled"}

                {listing ? listing.listingStatus : "Not Listed"}
              </td>

              <td>
                {!listing && !isEditing && (
                  <button onClick={() => setEditingChannelId(channel.id)}>
                    List
                  </button>
                )}

                {listing && !isEditing && (
                  <>
                    <button onClick={() => setEditingChannelId(channel.id)}>
                      Update
                    </button>

                    <ConfirmButton
                      message="Are you sure you want to delist this product?"
                      onConfirm={() => {
                        const formData = new FormData();
                        formData.append("listingId", listing.id);
                        formData.append("productId", product.id);
                        delistAction(formData);
                      }}
                      style={{ marginLeft: 6 }}
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
                      <input type="hidden" name="discount" value={discount} />
                      <input type="hidden" name="markup" value={markup} />
                    </form>

                    <ConfirmButton
                      message="Confirm listing with this pricing?"
                      onConfirm={() =>
                        formRefs.current[channel.id]?.requestSubmit()
                      }
                    >
                      Save
                    </ConfirmButton>

                    <button
                      type="button"
                      onClick={() => setEditingChannelId(null)}
                      style={{ marginLeft: 6 }}
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
