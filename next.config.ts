import type { NextConfig } from "next";

const configuredAPI = process.env.NEXT_PUBLIC_API_URL;
if (process.env.VERCEL_ENV === "production" && (!configuredAPI || !configuredAPI.startsWith("https://"))) {
  throw new Error("Production hosting requires an HTTPS NEXT_PUBLIC_API_URL");
}
const apiOrigin = new URL(configuredAPI ?? "http://localhost:8000").origin;
const isDev = process.env.NODE_ENV === "development";
const nextConfig: NextConfig = {
  output: "standalone",
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
};
export default nextConfig;
