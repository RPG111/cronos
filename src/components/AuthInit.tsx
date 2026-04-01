"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export default function AuthInit() {
  useEffect(() => {
    return useAppStore.getState().initAuth();
  }, []);

  return null;
}
