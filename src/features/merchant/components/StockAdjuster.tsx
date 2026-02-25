"use client"

import AppButton from "@/components/AppButton"

export default function StockAdjuster({
  id,
  increase,
  decrease,
}: {
  id: string
  increase: (id: string) => void
  decrease: (id: string) => void
}) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <AppButton onClick={() => decrease(id)}>-</AppButton>
      <AppButton onClick={() => increase(id)}>+</AppButton>
    </div>
  )
}
