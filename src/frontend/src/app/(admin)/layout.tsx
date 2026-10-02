import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/admin/admin.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Site admin",
  robots: { index: false, follow: false },
};

/**
 * The admin console's root layout: its own Tailwind and shadcn tokens, none of the DDI's or the homepage's CSS. Only
 * Chad uses it, over Tailscale; the public ingress blocks /admin and /api/admin (docs/design.md section 13.8).
 */
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
