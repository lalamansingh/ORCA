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
        src: "/favicon.ico",
        sizes: "256x256",
        type: "image/x-icon",
      },
    ],
  };
}
