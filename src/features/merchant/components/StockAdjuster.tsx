"use client"

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
      <button onClick={() => decrease(id)}>-</button>
      <button onClick={() => increase(id)}>+</button>
    </div>
  )
}