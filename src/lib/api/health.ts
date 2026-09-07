import { apiClient } from "@/lib/api/client";
import { API_V1_PREFIX } from "@/lib/api/config";
export interface HealthResponse { status: "healthy" | "degraded"; service: "orca-api"; version: string; environment: string; dependencies: { database: { status: "healthy" | "unavailable"; postgis: boolean | null } }; }
export const getHealth = (): Promise<HealthResponse> => apiClient<HealthResponse>(`${API_V1_PREFIX}/health`);
