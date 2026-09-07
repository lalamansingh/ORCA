"use client";
import { useSyncExternalStore } from "react";
import type { SelectedLocation } from "@/features/map/types";

let selectedLocation:SelectedLocation|null=null;
const listeners=new Set<()=>void>();
export function publishSelectedLocation(location:SelectedLocation|null){selectedLocation=location;for(const listener of listeners)listener();}
export function useSharedSelectedLocation(){return useSyncExternalStore((listener)=>{listeners.add(listener);return()=>listeners.delete(listener);},()=>selectedLocation,()=>null);}
