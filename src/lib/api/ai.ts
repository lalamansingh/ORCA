import {apiClient} from "@/lib/api/client";
import {API_V1_PREFIX} from "@/lib/api/config";
import type {QueryExtraction} from "@/features/ai/types";
export const extractQuery=(query:string)=>apiClient<QueryExtraction>(`${API_V1_PREFIX}/ai/extract-query`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query}),timeoutMs:30_000});
