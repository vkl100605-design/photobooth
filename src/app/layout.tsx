import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { BoothProvider } from "@/contexts/BoothContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Vintage Photobooth — Capture Memories That Feel Real",
  description: "Step into an immersive virtual vintage photobooth to capture, filter, and print classic photo strips.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-stone-950 scroll-smooth">
      <body className={`${inter.variable} ${playfair.variable} font-sans text-stone-100 antialiased min-h-screen flex flex-col`}>
        <BoothProvider>{children}</BoothProvider>
      </body>
    </html>
  );
}
