import type { MetadataRoute } from "next";
import { baseURL } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/settings", "/admin"],
    },
    sitemap: `${baseURL}/sitemap.xml`,
  };
}
