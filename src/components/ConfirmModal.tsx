"use client";

import { useAtom } from "jotai";
import { confirmAtom } from "@/state/confirm";
import AppButton from "@/components/AppButton";

export default function ConfirmModal() {
  const [confirm, setConfirm] = useAtom(confirmAtom);

  if (!confirm) return null;

  const handleYes = () => {
    confirm.onConfirm();
    setConfirm(null);
  };

  const handleNo = () => {
    setConfirm(null);
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 2000,
        }}
        onClick={handleNo}
      />

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "white",
          padding: 24,
          borderRadius: 8,
          zIndex: 2001,
          minWidth: 320,
          textAlign: "center",
        }}
      >
        <p>{confirm.message}</p>

        <div style={{ marginTop: 20 }}>
          <AppButton onClick={handleYes} style={{ marginRight: 10 }}>
            Yes
          </AppButton>
          <AppButton onClick={handleNo}>No</AppButton>
        </div>
      </div>
    </>
  );
}
