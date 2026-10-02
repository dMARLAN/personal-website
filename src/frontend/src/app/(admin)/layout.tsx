import type { Metadata } from "next";
import "@/admin/admin.css";

export const metadata: Metadata = {
  title: "Site admin",
  robots: { index: false, follow: false },
};

/**
 * The admin console's root layout: plain HTML forms, none of the DDI's or the homepage's CSS. Only Chad uses it, over
 * Tailscale; the public ingress blocks /admin and /api/admin (docs/design.md section 13.8).
 */
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body className="admin">{children}</body>
    </html>
  );
}
