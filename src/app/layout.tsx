import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Call-E Portal",
  description: "Voice recognition call portal for customer service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
