import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { baseURL } from "@/lib/env";
import { site } from "@/lib/site";

// The preview shown when the site is shared (LinkedIn, X, Slack, WhatsApp…).
// Rendered once at build time.

export const alt = `${site.name}: authentication starter for Next.js`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Read at module level (not inside the handler) so the image is built once at
// build time instead of on every request.
const fonts = join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans");
const [regular, semibold] = await Promise.all([
  readFile(join(fonts, "Geist-Regular.ttf")),
  readFile(join(fonts, "Geist-SemiBold.ttf")),
]);

const features = ["Passkeys", "Two-factor", "Google & GitHub", "Roles & admin panel"];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#16171c",
          color: "#fafafa",
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#2a2c36" />
            <path
              d="M16 7.5 9.5 10v5.6c0 4 2.7 7.6 6.5 8.9 3.8-1.3 6.5-4.9 6.5-8.9V10L16 7.5Z"
              stroke="#fafafa"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="m13 16 2.2 2.2L19.5 14" stroke="#fafafa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 600 }}>{site.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2 }}>
            Authentication you can ship on day one.
          </div>
          <div style={{ fontSize: 30, color: "#a1a1aa" }}>Open-source starter for Next.js</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {features.map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  fontSize: 24,
                  padding: "10px 20px",
                  borderRadius: 999,
                  border: "1px solid #3f3f46",
                  color: "#e4e4e7",
                }}
              >
                {f}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 24, color: "#a1a1aa" }}>{new URL(baseURL).host}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: regular, weight: 400, style: "normal" },
        { name: "Geist", data: semibold, weight: 600, style: "normal" },
      ],
    },
  );
}
