import type { NextConfig } from "next";
import { apiInternalUrl } from "./src/lib/api/internalUrl";

const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin !== "");

const nextConfig: NextConfig = {
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
  output: "standalone",
  // The dev badge sits on the BRT knob in the bezel corner.
  devIndicators: false,
  // Only pages drawn from fallback content are ISR pages (src/content/source.ts). Past this age the next request
  // renders them again before answering, so a visitor never gets a build-time snapshot older than this.
  expireTime: 60,
  // The browser reaches FastAPI at the site's own origin, which the admin session cookie (SameSite=Strict, Path=/)
  // and CSRF rely on (docs/design.md section 13.6). `next build` bakes the destination in.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiInternalUrl()}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
