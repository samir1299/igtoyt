import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReelFlow",
  description: "Internal AI video processing tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[var(--color-background)]">
        {children}
      </body>
    </html>
  );
}
