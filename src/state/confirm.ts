import { atom } from "jotai";

export type ConfirmState = {
  message: string;
  onConfirm: () => void;
} | null;

export const confirmAtom = atom<ConfirmState>(null);