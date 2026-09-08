/** The single browser-visible backend URL configuration point. */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://orca-production-eef7.up.railway.app"
).replace(/\/$/, "");
export const API_V1_PREFIX = "/api/v1";


