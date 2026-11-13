import type { MetadataRoute } from "next";
import { baseURL } from "@/lib/env";

// Only public, indexable pages. Sign-in and account pages are noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseURL, changeFrequency: "monthly", priority: 1 },
    { url: `${baseURL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
