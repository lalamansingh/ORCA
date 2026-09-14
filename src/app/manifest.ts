import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ORCA — Marine Intelligence & Fisher Companion",
    short_name: "ORCA Marine",
    description: "Marine Ecosystem Reasoning with Collaborative Agents for safe fishing voyages.",
    start_url: "/mobile",
    display: "standalone",
    background_color: "#082536",
    theme_color: "#082536",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
