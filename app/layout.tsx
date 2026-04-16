import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Access codes",
  description: "Generate and validate access codes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
