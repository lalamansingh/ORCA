import { API_BASE_URL } from "@/lib/api/config";

export class APIClientError extends Error {
  constructor(message: string, public readonly status?: number, public readonly requestId?: string) {
    super(message);
    this.name = "APIClientError";
  }
}

export interface APIRequestOptions extends RequestInit { timeoutMs?: number; }

/** Lightweight typed fetch wrapper for future ORCA backend modules. */
export async function apiClient<T>(path: string, options: APIRequestOptions = {}): Promise<T> {
  const { timeoutMs = 5_000, headers, ...requestOptions } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  const requestId = crypto.randomUUID();
  try {
    const method = (requestOptions.method ?? "GET").toUpperCase();
    let csrfToken: string | undefined;
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      try {
        const csrfResponse = await fetch(`${API_BASE_URL}/api/v1/auth/csrf`, { credentials: "include", cache: "no-store", signal: controller.signal });
        if (csrfResponse.ok) {
          csrfToken = ((await csrfResponse.json()) as { csrf_token: string }).csrf_token;
        }
      } catch {
        // Proceed without csrf token for guest/stateless requests
      }
    }
    const response = await fetch(`${API_BASE_URL}${path}`, { ...requestOptions, credentials: "include", headers: { Accept: "application/json", "X-Request-ID": requestId, ...(method !== "GET" && csrfToken ? { "X-CSRF-Token": csrfToken } : {}), ...headers }, signal: controller.signal });
    const responseRequestId = response.headers.get("X-Request-ID") ?? undefined;
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const message = typeof body === "object" && body !== null && "error" in body ? String((body as { error?: { message?: string } }).error?.message ?? "API request failed.") : "API request failed.";
      throw new APIClientError(message, response.status, responseRequestId);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof APIClientError) throw error;
    throw new APIClientError(error instanceof DOMException && error.name === "AbortError" ? "The API request timed out." : "The API is unavailable.");
  } finally { window.clearTimeout(timer); }
}
