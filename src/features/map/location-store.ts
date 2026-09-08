"use client";
import { useSyncExternalStore } from "react";
import type { SelectedLocation } from "@/features/map/types";

export const DEFAULT_COASTAL_LOCATION: SelectedLocation = {
  latitude: 18.92,
  longitude: 72.83,
  source: "default",
  label: "Mumbai Port & Coastal Sector",
};

let selectedLocation: SelectedLocation | null = DEFAULT_COASTAL_LOCATION;
const listeners = new Set<() => void>();

export function publishSelectedLocation(location: SelectedLocation | null) {
  selectedLocation = location ?? DEFAULT_COASTAL_LOCATION;
  for (const listener of listeners) listener();
}

export function useSharedSelectedLocation() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => selectedLocation,
    () => DEFAULT_COASTAL_LOCATION,
  );
}

