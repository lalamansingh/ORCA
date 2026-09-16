"use client";
import { useState } from "react";
import type { MarineMapLayer } from "@/features/map/types";
import { marineLayers } from "@/features/map/mock-layers";
export function useMapLayers(){
  const [layers,setLayers]=useState<MarineMapLayer[]>(marineLayers);
  const toggle=(id:string)=>setLayers(items=>items.map(layer=>layer.id===id&&layer.available?{...layer,enabled:!layer.enabled}:layer));
  const enable=(id:string)=>setLayers(items=>items.map(layer=>layer.id===id&&layer.available?{...layer,enabled:true}:layer));
  return{layers,toggle,enable,setLayers};
}
