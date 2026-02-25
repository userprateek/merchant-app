"use client";

import { ReactNode } from "react";
import { useSetAtom } from "jotai";
import { confirmAtom } from "@/state/confirm";
import AppButton from "@/components/AppButton";

type Props = {
  message: string;
  onConfirm?: () => void;
  formId?: string;
  children: ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
};

export default function ConfirmButton({
  message,
  onConfirm,
  formId,
  children,
  style,
  disabled,
}: Props) {
  const setConfirm = useSetAtom(confirmAtom);

  return (
    <AppButton
      disabled={disabled}
      style={style}
      onClick={() => {
        const handler =
          onConfirm ??
          (() => {
            if (!formId) return;
            const form = document.getElementById(formId) as HTMLFormElement | null;
            form?.requestSubmit();
          });

        if (!handler) return;

        setConfirm({
          message,
          onConfirm: handler,
        })
      }}
    >
      {children}
    </AppButton>
  );
}
