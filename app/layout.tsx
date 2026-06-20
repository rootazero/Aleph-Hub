import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aleph Hub",
  description:
    "Centralized extension catalog for Aleph — skills, plugins, and MCP servers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
