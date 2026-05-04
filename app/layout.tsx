import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
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
        <Sidebar />
        <div className="pl-60">
          <Header />
          <main className="px-6 py-6">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
