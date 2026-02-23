"use client";

import { useAtom } from "jotai";
import { alertAtom } from "@/state/alert";

export default function GlobalAlert() {
  const [alert, setAlert] = useAtom(alertAtom);

  if (!alert) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        padding: 16,
        background:
          alert.type === "error"
            ? "#ff4d4f"
            : alert.type === "success"
            ? "#52c41a"
            : "#1890ff",
        color: "white",
        borderRadius: 8,
      }}
      onClick={() => setAlert(null)}
    >
      {alert.message}
    </div>
  );
}