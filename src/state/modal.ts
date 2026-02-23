import { atom } from "jotai";

export type GlobalModalState = {
  message: string;
  type?: "info" | "error" | "success";
  onClose?: () => void;
} | null;

export const globalModalAtom = atom<GlobalModalState>(null);