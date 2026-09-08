/** The single browser-visible backend URL configuration point. */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && !window.location.hostname.includes("localhost")
    ? ""
    : "http://localhost:8000")
).replace(/\/$/, "");
export const API_V1_PREFIX = "/api/v1";

