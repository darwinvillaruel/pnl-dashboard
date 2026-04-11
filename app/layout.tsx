import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PNL Dashboard — Australia",
  description: "Internal P&L performance dashboard for creative strategy verticals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
