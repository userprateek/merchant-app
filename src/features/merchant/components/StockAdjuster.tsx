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
    <div className="actions-row">
      <AppButton onClick={() => decrease(id)}>-</AppButton>
      <AppButton onClick={() => increase(id)}>+</AppButton>
    </div>
  )
}
