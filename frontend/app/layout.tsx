import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nextboot connection bench",
  description: "Next.js, Spring Boot, and Neon on Vercel",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
