"use client";

import { useActionState } from "react";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { globalModalAtom } from "@/state/modal";
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
    <form action={formAction}>
      <input name="name" placeholder="Name" required />
      <input name="sku" placeholder="SKU" required />
      <input name="basePrice" type="number" required />
      <input name="totalStock" type="number" required />

      <button type="submit">Add Product</button>
    </form>
  );
}
