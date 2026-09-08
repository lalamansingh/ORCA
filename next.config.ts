import type { NextConfig } from "next";

const configuredAPI = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const isDev = process.env.NODE_ENV === "development";

let apiOrigin = "http://localhost:8000 https://*.railway.app https://*.up.railway.app https://*.render.com";
try {
  if (configuredAPI && configuredAPI.startsWith("http")) {
    apiOrigin = `${new URL(configuredAPI).origin} ${apiOrigin}`;
  }
} catch {
  // Safe fallback for origin parsing
}
const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  turbopack: { root: process.cwd() },
  async headers() {
    const tileHosts = [
      "https://tiles.openfreemap.org",
      "https://*.arcgisonline.com",
      "https://server.arcgisonline.com",
      "https://services.arcgisonline.com",
      "https://*.basemaps.cartocdn.com",
      "https://*.tile.openstreetmap.org",
      "https://demotiles.maplibre.org",
    ].join(" ");

    const headers = [
      {
        key: "Content-Security-Policy",
        value: `default-src 'self'; script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: ${tileHosts}; connect-src 'self' ${apiOrigin} ${tileHosts}${isDev ? " ws://localhost:3000" : ""}; worker-src 'self' blob:; font-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
      },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(self)" },
    ];
    if (process.env.VERCEL_ENV === "production") headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
    return [{ source: "/:path*", headers }];
  },
  async rewrites() {
    const backendUrl = (
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://orca-production-eef7.up.railway.app"
    ).replace(/\/$/, "");

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/openapi.json",
        destination: `${backendUrl}/openapi.json`,
      },
    ];
  },
};
export default nextConfig;

