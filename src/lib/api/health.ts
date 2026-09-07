import { apiClient } from "@/lib/api/client";
import { API_V1_PREFIX } from "@/lib/api/config";
export interface ProviderHealth { status:"operational"|"unavailable"|"not_checked"; last_success:string|null }
export interface HealthResponse { status: "healthy" | "degraded"; service: "orca-api"; version: string; environment: string; dependencies: { database: { status: "healthy" | "unavailable"; postgis: boolean | null }; weather_provider:ProviderHealth; marine_provider:ProviderHealth }; }
export const getHealth = (): Promise<HealthResponse> => apiClient<HealthResponse>(`${API_V1_PREFIX}/health`);
export interface DataSourceStatus {provider:string;status:string;last_success:string|null;last_failure:string|null;error_code:string|null}
export interface DataSourcesResponse {weather:DataSourceStatus;marine:DataSourceStatus;alerts:DataSourceStatus[];pfz:DataSourceStatus;risk_engine:DataSourceStatus;llm:DataSourceStatus}
export const getDataSources=():Promise<DataSourcesResponse>=>apiClient<DataSourcesResponse>(`${API_V1_PREFIX}/system/data-sources`);
