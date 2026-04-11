import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uleads - P&L Dashboard",
  description:
    "Internal P&L performance dashboard tool for media buyers at Uleads. Track and analyze campaign performance, optimize ad spend, and maximize ROI with real-time data insights.",
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
