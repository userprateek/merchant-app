"use client";

import { useAtom } from "jotai";
import { globalModalAtom } from "@/state/modal";
import AppButton from "@/components/AppButton";

export default function GlobalModal() {
  const [modal, setModal] = useAtom(globalModalAtom);

  if (!modal) return null;

  const handleClose = () => {
    if (modal.onClose) {
      modal.onClose();
    }
    setModal(null);
  };

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
        }}
        onClick={handleClose}
      />

      {/* Centered Box */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "white",
          padding: 24,
          borderRadius: 8,
          zIndex: 1001,
          minWidth: 300,
          textAlign: "center",
        }}
      >
        <p>{modal.message}</p>

        <AppButton
          style={{ marginTop: 16 }}
          onClick={handleClose}
        >
          Close
        </AppButton>
      </div>
    </>
  );
}
