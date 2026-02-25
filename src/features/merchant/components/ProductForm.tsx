"use client";

import { useActionState } from "react";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { globalModalAtom } from "@/state/modal";
import FloatingInput from "@/components/FloatingInput";
import AppButton from "@/components/AppButton";
type FormState = { success: true } | { error: string } | null;

type FormAction = (
  prevState: FormState,
  formData: FormData
) => Promise<FormState>;

export default function ProductForm({ action }: { action: FormAction }) {
  const [state, formAction] = useActionState<FormState, FormData>(action, null);

  const [, setModal] = useAtom(globalModalAtom);

  useEffect(() => {
    if (!state) return;

    if ("error" in state) {
      setModal({
        message: state.error,
        type: "error",
      });
    }

    if ("success" in state) {
      setModal({
        message: "Product added successfully",
        type: "success",
      });
    }
  }, [state, setModal]);

  return (
    <form action={formAction} className="form-shell">
      <div className="form-grid">
        <FloatingInput name="name" label="Name" required />
        <FloatingInput name="sku" label="SKU" upperCase required />
        <FloatingInput name="basePrice" label="Base Price" type="number" required />
        <FloatingInput name="totalStock" label="Total Stock" type="number" required />
      </div>

      <AppButton type="submit">Add Product</AppButton>
    </form>
  );
}
