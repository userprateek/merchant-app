"use client";

import { ReactNode } from "react";
import { useSetAtom } from "jotai";
import { confirmAtom } from "@/state/confirm";

type Props = {
  message: string;
  onConfirm: () => void;
  children: ReactNode;
  style?: React.CSSProperties;
};

export default function ConfirmButton({
  message,
  onConfirm,
  children,
  style,
}: Props) {
  const setConfirm = useSetAtom(confirmAtom);

  return (
    <button
      style={style}
      onClick={() =>
        setConfirm({
          message,
          onConfirm,
        })
      }
    >
      {children}
    </button>
  );
}