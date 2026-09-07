import { apiClient } from "@/lib/api/client";
import { API_V1_PREFIX } from "@/lib/api/config";
import type { OceanMetadata, OceanSampleResponse } from "@/features/ocean-products/types";
export const getOceanProducts=()=>apiClient<{products:OceanMetadata[]}>(`${API_V1_PREFIX}/ocean-products`);
export const getOceanSamples=(latitude:number,longitude:number)=>apiClient<OceanSampleResponse>(`${API_V1_PREFIX}/ocean-products/sample?${new URLSearchParams({latitude:String(latitude),longitude:String(longitude),products:"sst,chlorophyll"})}`);
