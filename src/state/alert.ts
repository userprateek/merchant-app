import { atom } from "jotai";

export type AlertState = {
  message: string;
  type: "success" | "error" | "info";
} | null;

export const alertAtom = atom<AlertState>(null);