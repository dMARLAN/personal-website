import type { Metadata, Viewport } from "next";
import { Barlow_Condensed } from "next/font/google";
import { PREPAINT_SCRIPT } from "@/ddi/controls/prepaint";
import { DEFAULT_CONTROLS, controlsStyle } from "@/ddi/controls/state";
import { COLORS } from "@/ddi/constants";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// The bezel placards' condensed sans (design section 4.5). The DDI text itself is stroke paths and needs no font.
const placardFont = Barlow_Condensed({
  weight: "500",
  subsets: ["latin"],
  variable: "--font-placard",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: `The personal website of ${SITE_NAME}.`,
};

export const viewport: Viewport = {
  themeColor: COLORS.faceBottom,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  // The server renders the default controls. The pre-paint script replaces them with the stored ones before first
  // paint, so <html> differs from the server HTML by design.
  return (
    <html
      lang="en"
      className={placardFont.variable}
      data-ddi-mode={DEFAULT_CONTROLS.mode}
      style={controlsStyle(DEFAULT_CONTROLS)}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
