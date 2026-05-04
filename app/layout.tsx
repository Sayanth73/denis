import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "TraceKebab",
  description:
    "POC de traçabilité kebab — réception, production, livraison, traçabilité bidirectionnelle.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans bg-background text-foreground antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
