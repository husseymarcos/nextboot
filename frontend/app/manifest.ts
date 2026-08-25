import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nextboot connection bench",
    short_name: "Nextboot",
    description: "Next.js, Spring Boot, and Neon on Vercel",
    start_url: "/",
    display: "standalone",
    background_color: "#eaf1ff",
    theme_color: "#3267e3",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
