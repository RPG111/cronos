"use client";

import { useEffect } from "react";
import { useAppStore, useGeoStore } from "@/lib/store";

export default function AuthInit() {
  useEffect(() => {
    useGeoStore.getState().requestLocation();
    return useAppStore.getState().initAuth();
  }, []);

  return null;
}
