"use client";

import { useEffect } from "react";
import { useAtom } from "jotai";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { globalModalAtom } from "@/state/modal";

export default function LoginErrorModalBridge() {
  const [, setModal] = useAtom(globalModalAtom);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (!errorCode) return;

    const message =
      errorCode === "invalid_credentials"
        ? "Invalid email or password."
        : "Login failed. Please try again.";

    setModal({ message, type: "error" });
    router.replace(pathname);
  }, [pathname, router, searchParams, setModal]);

  return null;
}
