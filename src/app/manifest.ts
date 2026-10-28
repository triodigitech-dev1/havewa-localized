import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Localea Rental & Property Management",
    short_name: "Localea",
    description:
      "Modern rental and property management system for residential and commercial units, leases, tenants, accounting, and maintenance with KES currency support.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#064e3b",
    theme_color: "#064e3b",
    icons: [
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
