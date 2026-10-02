import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import { THEME_PREPAINT_SCRIPT } from "@/theme/prepaint";
import "@/home/home.css";
import "@/theme/toggle.css";

const sans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

// The page background per theme (--page in home.css). It follows the OS, not the visitor's override.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e3e7df" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0d0b" },
  ],
  colorScheme: "light dark",
};

/**
 * The standard homepage's root layout. It is separate from the DDI's, so `/` loads none of the DDI's CSS, materials
 * or controls; only the theme carries over. The pre-paint script sets `data-theme` before first paint, so <html>
 * differs from the server HTML by design.
 */
export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_PREPAINT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
