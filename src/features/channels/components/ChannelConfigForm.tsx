"use client";

import { useActionState, useEffect } from "react";
import { useAtom } from "jotai";
import { globalModalAtom } from "@/state/modal";
import FloatingInput from "@/components/FloatingInput";
import AppButton from "@/components/AppButton";

type FormState = { success: true } | { error: string } | null;

type ChannelDefaults = {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  webhookSecret: string;
  isSandbox: boolean;
  isEnabled: boolean;
};

type Props = {
  defaults: ChannelDefaults;
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
};

export default function ChannelConfigForm({ defaults, action }: Props) {
  const [state, formAction] = useActionState<FormState, FormData>(action, null);
  const [, setModal] = useAtom(globalModalAtom);

  useEffect(() => {
    if (!state) return;
    if ("error" in state) {
      setModal({ message: state.error, type: "error" });
      return;
    }
    setModal({ message: "Channel configuration updated", type: "success" });
  }, [state, setModal]);

  return (
    <form action={formAction} className="form-shell">
      <div className="form-grid">
        <FloatingInput name="baseUrl" label="Base URL" defaultValue={defaults.baseUrl} />
        <FloatingInput name="apiKey" label="API Key" defaultValue={defaults.apiKey} />
        <FloatingInput name="apiSecret" label="API Secret" defaultValue={defaults.apiSecret} />
        <FloatingInput name="accessToken" label="Access Token" defaultValue={defaults.accessToken} />
        <FloatingInput name="webhookSecret" label="Webhook Secret" defaultValue={defaults.webhookSecret} />
      </div>

      <div className="checkbox-row">
        <label className="checkbox-item">
          <input type="checkbox" name="isSandbox" defaultChecked={defaults.isSandbox} />
          Sandbox Mode
        </label>
        <label className="checkbox-item">
          <input type="checkbox" name="isEnabled" defaultChecked={defaults.isEnabled} />
          Enable Channel
        </label>
      </div>

      <AppButton type="submit">Save Configuration</AppButton>
    </form>
  );
}
