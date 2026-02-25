"use client";

import { useEffect } from "react";

export default function VersionLogger() {
  useEffect(() => {
    console.log("Version: 1.0.7");
  }, []);

  return null;
}